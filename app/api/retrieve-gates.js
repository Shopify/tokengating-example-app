import { myAppMetafieldNamespace, myHandle } from "./constants.js";

const GATES_QUERY = `#graphql
  query getGateConfigurations($first: Int!, $handleQuery: String!, $namespace: String!) {
    gateConfigurations(query: $handleQuery, first: $first) {
      nodes {
        id
        name
        handle
        requirements: metafield(namespace: $namespace, key: "requirements") {
          value
        }
        reaction: metafield(namespace: $namespace, key: "reaction") {
          value
        }
        subjectBindings(first: $first) {
          nodes {
            id
          }
          totalCount
        }
        createdAt
        updatedAt
      }
    }
  }
`;

export default async function retrieveGates(graphql) {
  const gates = await graphql(GATES_QUERY, {
    variables: {
      first: 20,
      handleQuery: `handle:${myHandle}`,
      namespace: myAppMetafieldNamespace,
    },
  });
  const gatesData = (await gates.json()).data;
  return gatesData.gateConfigurations.nodes;
}
