//PARAMETERS
@description('The Key Vault name')
param keyVaultName string

@description('The principal ID of the managed identity')
param principalId string

@description('The principal type (usually ServicePrincipal for managed identities)')
param principalType string = 'ServicePrincipal'

@description('The role definition ID for Key Vault access')
param roleDefinitionId string = '4633458b-17de-408a-b874-0445c86b69e6' // Built-in 'Key Vault Secrets User' role ID

// Reference existing Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' existing = {
  name: keyVaultName
}

// Add RBAC role assignment for the managed identity (Key Vault Secrets User role)
resource kvRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, principalId, 'KeyVaultSecretsUser') // Unique name
  scope: keyVault // Assign at vault level
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleDefinitionId)
    principalId: principalId
    principalType: principalType
  }
}

// Outputs
output roleAssignmentId string = kvRoleAssignment.id
output keyVaultId string = keyVault.id
