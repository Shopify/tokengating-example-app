import { myAppMetafieldNamespace, myHandle } from "./constants.js";
import { createAutomaticDiscount } from "./create-discount.js";

const CREATE_GATE_CONFIGURATION_MUTATION = `#graphql
  mutation createGateConfiguration(
    $name: String!,
    $requirements: String!,
    $reaction: String!,
    $namespace: String!,
    $handle: String!
  ) {
    gateConfigurationCreate(input: {
        name: $name,
        metafields: [{
          namespace: $namespace,
          key: "requirements",
          type: "json",
          value: $requirements
        },
        {
          namespace: $namespace,
          key: "reaction",
          type: "json",
          value: $reaction
        }],
        handle: $handle
      }) {
      gateConfiguration {
        id
        name
        createdAt
        updatedAt
        metafields(namespace: $namespace, first: 10) {
          nodes {
            key
            value
            namespace
            type
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CREATE_GATE_SUBJECT_MUTATION = `#graphql
  mutation createGateSubject ($gateConfigurationId: ID!, $subject: ID!, $namespace: String!){
    gateSubjectCreate(input: {
      gateConfigurationId: $gateConfigurationId,
      active: true,
      subject: $subject
    }) {
      gateSubject {
        id
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
      userErrors {
        field
        message
      }
    }
  }
`;

const UPDATE_GATE_SUBJECT_MUTATION = `#graphql
  mutation updateGateSubject ($gateConfigurationId: ID!, $id: ID!, $namespace: String!){
    gateSubjectUpdate(input: {
      gateConfigurationId: $gateConfigurationId,
      id: $id
    }) {
      gateSubject {
        id
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
      userErrors {
        field
        message
      }
    }
  }
`;

const PRODUCTS_QUERY = `#graphql
query retrieveProducts ($queryString: String!, $first: Int!){
  products(query: $queryString, first: $first) {
    nodes {
      id
      gates {
        id
        active
      }
    }
  }
}
`;

export default async function createGate(
  graphql,
  { name, discountType, discount, segment, productGids }
) {
  const segmentConditions = segment.map((address) => {
    return {
      name: `Gate for ${address.slice(0, 5)}`, // Replace with your gate name
      conditionsDescription: "Any token", // Replace with your condition description
      contractAddress: address,
      imageUrl: "https://placekitten.com/g/200/200", // Replace with token collection image URL
    };
  });

  const gateConfigurationRequirements = {
    logic: "ANY",
    conditions: segmentConditions,
  };

  const gateConfigurationReaction = {
    name: name,
    type: "discount",
    discount: {
      type: discountType,
      value: discount,
    },
  };

  const createGateResponse = await graphql(CREATE_GATE_CONFIGURATION_MUTATION, {
    variables: {
      name,
      requirements: JSON.stringify(gateConfigurationRequirements),
      reaction: JSON.stringify(gateConfigurationReaction),
      namespace: myAppMetafieldNamespace,
      handle: myHandle,
    },
  });
  const gateResponseData = (await createGateResponse.json()).data;
  const gateConfiguration =
    gateResponseData.gateConfigurationCreate.gateConfiguration;
  const gateConfigurationId = gateConfiguration.id;

  createAutomaticDiscount(graphql, gateConfiguration);

  if (productGids.length === 0) {
    return;
  }

  const retrieveProductsResponse = await graphql(PRODUCTS_QUERY, {
    variables: {
      queryString: generateProductsQueryString(productGids),
      first: 100,
    },
  });
  const products = (await retrieveProductsResponse.json()).data.products.nodes;

  for (const product of products) {
    if (product.gates.length > 0) {
      const activeGateSubjectId = product.gates[0].id;
      await graphql(UPDATE_GATE_SUBJECT_MUTATION, {
        variables: {
          gateConfigurationId,
          id: activeGateSubjectId,
          namespace: myAppMetafieldNamespace,
        },
      });
    } else {
      await graphql(CREATE_GATE_SUBJECT_MUTATION, {
        variables: {
          gateConfigurationId,
          subject: product.id,
          namespace: myAppMetafieldNamespace,
        },
      });
    }
  }
}

const generateProductsQueryString = (productGids) => {
  return productGids
    .map((productGid) => {
      const id = productGid.split("/").pop();
      return `(id:${id})`;
    })
    .join(" OR ");
};
