//PARAMETERS
param searchServiceName string
param location string
param tags object
param replicaCount int
param partitionCount int
param sku string
param roleAssignments array
param applicationPrefix string
// variables
// var uniqueId = uniqueString(resourceGroup().id)
//var moduleNameSuffix = '-Module-${applicationPrefix}-${environment}-st-${instanceName}'


module searchService 'br/public:avm/res/search/search-service:0.11.1' = {
  name: 'searchServiceDeployment'
  params:{
    name: '${applicationPrefix}-${searchServiceName}'
    location: location
    tags: tags
    sku: sku
    disableLocalAuth: false
    authOptions: {
      aadOrApiKey: {
        aadAuthFailureMode: 'http401WithBearerChallenge'
      }
    }
    replicaCount: replicaCount
    partitionCount: partitionCount
    roleAssignments: roleAssignments
  }
}
