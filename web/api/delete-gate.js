import { GraphqlQueryError } from "@shopify/shopify-api";
import shopify from "../shopify.js";

const DELETE_GATE_CONFIGURATION_MUTATION = `
  mutation deleteGateConfiguration($id: ID!) {
    gateConfigurationDelete(input:{
      id: $id
    }) {
      deletedGateConfigurationId
    }
  }
`;

export default async function deleteGate({ session, gateConfigurationGid }) {
  const client = new shopify.api.clients.Graphql({ session });
  try {
    const response = await client.query({
      data: {
        query: DELETE_GATE_CONFIGURATION_MUTATION,
        variables: {
          id: gateConfigurationGid,
        },
      },
    });
    return response.body.data.gateConfigurationDelete;
  } catch (error) {
    if (error instanceof GraphqlQueryError) {
      throw new Error(
        `${error.message}\n${JSON.stringify(error.response, null, 2)}`
      );
    } else {
      throw error;
    }
  }
}
