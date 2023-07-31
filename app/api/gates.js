import { myAppMetafieldNamespace } from "./constants.js";

export async function getContractAddressesFromGate(graphql, { productGid }) {
  const response = await getGatesByProductGid(graphql, { productGid });
  const requirements = JSON.parse(
    response.product.gates?.[0]?.configuration?.requirements?.value
  );
  const contractAddresses = requirements?.conditions.map(
    (condition) => condition.contractAddress
  );
  return contractAddresses;
}

export async function getGatesByProductGid(graphql, { productGid }) {
  const response = await graphql(query, {
    variables: { productGid, namespace: myAppMetafieldNamespace },
  });
  return (await response.json()).data;
}

const query = `#graphql
  query FetchProductGates($productGid: ID!, $namespace: String!) {
    product(id: $productGid) {
      gates {
        id
        active
        configuration {
          id
          name
          requirements: metafield(namespace: $namespace, key: "requirements") {
              value
          }
          reaction: metafield(namespace: $namespace, key: "reaction") {
              value
          }
          createdAt
          updatedAt
        }
        createdAt
        updatedAt
      }
    }
  }
`;
