import { IndexTable, Page } from "@shopify/polaris";

export default function Tokengates() {
  const tableHeadings = [
    { id: "Gate", title: "Gate" },
    { id: "Perk", title: "Perk" },
    { id: "Segment", title: "Segment" },
    { id: "Products", title: "Products" },
  ];

  return (
    <Page narrowWidth>
      <ui-title-bar title={"Tokengates"} />
      <IndexTable
        emptyState={<p>No Tokengates found</p>}
        headings={tableHeadings}
        itemCount={gatesData?.response?.length ?? 0}
        resourceName={{
          singular: "Tokengate",
          plural: "Tokengates",
        }}
        selectable={false}
      ></IndexTable>
    </Page>
  );
}

function TableRow() {
  return <>a</>;
}
