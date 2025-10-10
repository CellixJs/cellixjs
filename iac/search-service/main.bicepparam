using './main.bicep'

param searchServiceName = 'cogeastus2'
param location = 'eastus2'
param tags = {
  environment: 'dev'
  application: 'ocm'
}
param sku = 'free'
param replicaCount = 1
param partitionCount = 1
param applicationPrefix = 'edplgrnd'

param roleAssignments = [
  { identityName: 'Connected Apps Developer', principalId: '2a3c51f6-5b0d-4075-a5e8-0654f68f6cd0', principalType: 'Group', roleDefinitionIdOrName: 'Search Service Contributor' }

  { identityName: 'Connected Apps Developer', principalId: '2a3c51f6-5b0d-4075-a5e8-0654f68f6cd0', principalType: 'Group', roleDefinitionIdOrName: 'Search Index Data Contributor' }
]
