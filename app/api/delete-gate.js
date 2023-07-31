const DELETE_GATE_CONFIGURATION_MUTATION = `#graphql
  mutation deleteGateConfiguration($id: ID!) {
    gateConfigurationDelete(input:{
      id: $id
    }) {
      deletedGateConfigurationId
    }
  }
`;

export default async function deleteGate(graphql, { gateConfigurationGid }) {
  const response = await graphql(DELETE_GATE_CONFIGURATION_MUTATION, {
    variables: {
      id: gateConfigurationGid,
    },
  });
  const responseData = (await response.json()).data;
  return responseData.gateConfigurationDelete;
}
