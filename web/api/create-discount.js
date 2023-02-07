import { myAppMetafieldNamespace } from "./constants.js";

const YOUR_FUNCTION_ID = "YOUR_FUNCTION_ID";
console.log(`Loaded function id ${YOUR_FUNCTION_ID}`);

if (YOUR_FUNCTION_ID == "YOUR_FUNCTION_ID") {
  console.error(`
    ************************************************************
    You must set the function ID in web/api/create-discount.js.
    Run \`npm run deploy\` and replace the YOUR_FUNCTION_ID with the function ID found in .env
    ************************************************************
  `);
}

const DISCOUNT_FUNCTION_QUERY = `
  query discountFunctionQuery {
    automaticDiscountNodes(first: 10) {
      nodes {
        id
        automaticDiscount {
          ... on DiscountAutomaticApp {
            discountId
            title
            appDiscountType {
              functionId
            }
          }
        }
        metafield(namespace: "${myAppMetafieldNamespace}", key: "gate_configuration_id") {
          value
        }
      }
    }
  }
`;

const CREATE_AUTOMATIC_DISCOUNT_MUTATION = `
  mutation CreateAutomaticDiscount($discount: DiscountAutomaticAppInput!) {
    discountCreate: discountAutomaticAppCreate(
      automaticAppDiscount: $discount
    ) {
      userErrors {
        code
        message
        field
      }
    }
  }
`;

export const createAutomaticDiscount = async (client, gateConfiguration) => {
  const shouldCreateDiscount = await noMatchingFunction(client, gateConfiguration);
  if (shouldCreateDiscount) {
    const response = await client.query({
      data: {
        query: CREATE_AUTOMATIC_DISCOUNT_MUTATION,
        variables: {
          discount: {
            title: gateConfiguration.name,
            functionId: YOUR_FUNCTION_ID,
            combinesWith: {
              productDiscounts: true,
              shippingDiscounts: true,
            },
            startsAt: new Date(),
            metafields: [
              {
                key: "gate_configuration_id",
                namespace: myAppMetafieldNamespace,
                type: "single_line_text_field",
                value: gateConfiguration.id
              }
            ]
          },
        },
      },
    });
  }
};

const noMatchingFunction = async (client, gateConfiguration) => {
  const response = await client.query({
    data: {
      query: DISCOUNT_FUNCTION_QUERY,
    },
  });

  if (!Boolean(response?.body?.data?.automaticDiscountNodes?.nodes)) return true;
  for (const node of response.body.data.automaticDiscountNodes.nodes) {
    const functionId = node.discount.automaticDiscount.functionId;
    const gateConfigurationId = node.metafield.value;
    if (YOUR_FUNCTION_ID == functionId &&
        gateConfiguration.id == gateConfigurationId) return false;
  }

  return true;
};
