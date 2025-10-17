//PARAMETERS
@description('Location for the search service resource')
param location string
@description('Tags to apply to the search service resource')
param tags object
@description('Number of replicas for the search service')
@minValue(1)
@maxValue(12)
param replicaCount int
@description('Number of partitions for the search service')
@minValue(1)
@maxValue(12)
param partitionCount int
@description('SKU pricing tier for the search service')
@allowed([
  'free'
  'basic'
  'standard'
  'standard2'
  'standard3'
  'storage_optimized_l1'
  'storage_optimized_l2'
])
param sku string
@description('Role assignments for the search service')
param roleAssignments array
@description('Application prefix for resource naming')
@maxLength(3)
param applicationPrefix string

// variables
var resourceTypes = loadJsonContent('../global/resource-types.json')
var uniqueId = uniqueString(resourceGroup().id)
var searchServiceName = '${applicationPrefix}${resourceTypes.cognitiveSearch}cog${location}${uniqueId}'

// search service
resource searchService 'Microsoft.Search/searchServices@2025-05-01' = {
  name: searchServiceName
  location: location
  tags: tags
  sku: {
    name: sku
  }
  properties: {
    disableLocalAuth: false
    authOptions: {
      aadOrApiKey: {
        aadAuthFailureMode: 'http401WithBearerChallenge'
      }
    }
    replicaCount: replicaCount
    partitionCount: partitionCount
  }
}

// role assignments
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for (roleAssignment, index) in roleAssignments: {
  name: guid(searchService.id, roleAssignment.principalId, roleAssignment.roleDefinitionId)
  scope: searchService
  properties: {
    roleDefinitionId: roleAssignment.roleDefinitionId
    principalId: roleAssignment.principalId
    principalType: roleAssignment.principalType
  }
}]
