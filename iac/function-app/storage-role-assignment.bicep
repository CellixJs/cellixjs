//PARAMETERS
@description('The Storage Account name')
param storageAccountName string

@description('The principal ID of the managed identity')
param principalId string

@description('The principal type (usually ServicePrincipal for managed identities)')
param principalType string = 'ServicePrincipal'

@description('The role definition ID for the storage data-plane role to assign')
param roleDefinitionId string

// Reference existing Storage Account
resource storageAccount 'Microsoft.Storage/storageAccounts@2022-05-01' existing = {
  name: storageAccountName
}

// Add RBAC role assignment for the managed identity on the storage account
resource storageRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: storageAccount
  name: guid(storageAccount.id, principalId, roleDefinitionId)
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleDefinitionId)
    principalId: principalId
    principalType: principalType
  }
}

// Outputs
output roleAssignmentId string = storageRoleAssignment.id
output storageAccountId string = storageAccount.id
