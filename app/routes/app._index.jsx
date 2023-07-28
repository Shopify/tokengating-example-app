import { useCallback } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import {
  IndexTable,
  Page,
  HorizontalStack,
  Button,
  Card,
} from "@shopify/polaris";

import { authenticate } from "../shopify.server";
import retrieveGates from "../api/retrieve-gates";
import deleteGate from "../api/delete-gate";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const gates = await retrieveGates(admin.graphql);

  return json({ gates });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const { id } = await request.json();

  await deleteGate(admin.graphql, { gateConfigurationGid: id });

  return null;
};

export default function Tokengates() {
  const { gates } = useLoaderData();
  const navigate = useNavigate();
  const submit = useSubmit();

  const deleteGate = useCallback(
    async (id) => {
      submit({ id }, { method: "DELETE", encType: "application/json" });
    },
    [submit]
  );

  const TableRows = () => {
    const perkTypeName = Object.freeze({
      discount: "Discount",
      exclusive: "Exclusive",
    });

    return gates.map((gate, index) => {
      const { id, name, requirements, reaction, subjectBindings } = gate;

      if (!requirements?.value || !reaction?.value) return null;

      const segment = (JSON.parse(requirements.value)?.conditions || [])
        .map((condition) => condition.contractAddress)
        .join(", ");

      const perkType = JSON.parse(reaction.value)?.type ?? "—";

      const numProducts = subjectBindings?.totalCount ?? "—";

      return (
        <IndexTable.Row id={id} key={id} position={index}>
          <IndexTable.Cell>{name}</IndexTable.Cell>
          <IndexTable.Cell>{perkTypeName[`${perkType}`]}</IndexTable.Cell>
          <IndexTable.Cell>{segment}</IndexTable.Cell>
          <IndexTable.Cell>{numProducts}</IndexTable.Cell>
          <IndexTable.Cell>
            <Button onClick={() => deleteGate(id)}>Delete</Button>
          </IndexTable.Cell>
        </IndexTable.Row>
      );
    });
  };

  const emptyState = (
    <Card>
      <HorizontalStack align="center">
        <p>No Tokengates found</p>
      </HorizontalStack>
    </Card>
  );

  return (
    <Page>
      <ui-title-bar title={"Tokengates"}>
        <button
          variant="primary"
          onClick={() => navigate("/app/tokengates/new")}
        >
          Create tokengate
        </button>
      </ui-title-bar>
      <IndexTable
        emptyState={emptyState}
        headings={[
          { id: "gate", title: "Gate" },
          { id: "perk", title: "Perk" },
          { id: "segment", title: "Segment" },
          { id: "products", title: "Products" },
          { id: "actions", title: "" },
        ]}
        itemCount={gates.length}
        resourceName={{
          singular: "Tokengate",
          plural: "Tokengates",
        }}
        selectable={false}
      >
        {TableRows()}
      </IndexTable>
    </Page>
  );
}
