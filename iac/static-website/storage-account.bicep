@description('Specifies the location for resources.')
param location string

@minLength(3)
@maxLength(24)
@description('Provide a name for the storage account. Use only lower case letters and numbers. The name must be unique within Azure.')
param storageAccountName string

@minLength(3)
@maxLength(24)
@description('Provide a name for the managedIdentityName. Use only lower case letters and numbers. The name must be unique within Azure.')
param managedIdentityName string

@allowed([
  'Standard_LRS'
  'Standard_GRS'
  'Standard_ZRS'
  'Premium_LRS'
  'Standard_RAGZRS'
])
@description('The storage account sku name.')
param sku string = 'Standard_RAGZRS'
@description('Tags')
param tags object

@allowed([
  'Blob'
  'Container'
  'None'
])
@description('Specifies whether data in the container may be accessed publicly and the level of access.')
param publicAccessLevel string = 'None'

var storageKind = 'StorageV2'

resource storageAccount 'Microsoft.Storage/storageAccounts@2025-01-01'= {
  name: storageAccountName
  location: location
  sku: {
    name: sku
  }
  kind:  storageKind
  properties: {
    accessTier: 'Hot'
    publicNetworkAccess: 'Enabled'
    minimumTlsVersion: 'TLS1_2'
  }
  tags: tags
}

@description('Array of allowed origins for CORS.')
param corsAllowedOrigins array
@description('Array of allowed methods for CORS.')
param corsAllowedMethods array
@description('Array of allowed headers for CORS.')
param corsAllowedHeaders array
@description('Array of exposed headers for CORS.')
param corsExposedHeaders array
@description('maxAge for CORS')
param corsMaxAgeInSeconds int

// Check to see if we have cors settings to include
var includeCorsRules = length(corsAllowedOrigins) > 1 || (length(corsAllowedOrigins) == 1 && corsAllowedOrigins[0] != '')

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2025-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    cors: {
      corsRules: includeCorsRules ? [
        {
          allowedOrigins: corsAllowedOrigins
          allowedMethods: corsAllowedMethods
          allowedHeaders: corsAllowedHeaders
          exposedHeaders: corsExposedHeaders
          maxAgeInSeconds: corsMaxAgeInSeconds
        }
      ] : []
    }
    deleteRetentionPolicy: {
      allowPermanentDelete: false
      enabled: false
    }
  }
}

resource blobServiceContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2025-01-01' = {
  parent: blobService
  name: '$web'
  properties: {
    immutableStorageWithVersioning: {
      enabled: false
    }
    defaultEncryptionScope: '$account-encryption-key'
    denyEncryptionScopeOverride: false
    publicAccess: publicAccessLevel
  }
}

//enable static website
@description('The path to the web index document.')
param indexDocumentPath string = 'index.html'

@description('The contents of the web index document.')
param indexDocumentContents string = '<h1>Example static website</h1>'

@description('The path to the web error document.')
param errorDocument404Path string = 'index.html'

@description('The contents of the web error document.')
param errorDocument404Contents string = '<h1>Example 404 error page</h1>'

resource contributorRoleDefinition 'Microsoft.Authorization/roleDefinitions@2018-01-01-preview' existing = {
  scope: subscription()
  // This is the Storage Account Contributor role, which is the minimum role permission we can give. See https://docs.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#:~:text=17d1049b-9a84-46fb-8f53-869881c3d3ab
  // For list of roles see: https://github.com/Azure/bicep/issues/1895#issuecomment-875137959
  name: '17d1049b-9a84-46fb-8f53-869881c3d3ab'
  
}

resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2025-01-31-preview' = {
  name: managedIdentityName
  location: location
}
///subscriptions/007d3e75-42c3-4169-b758-35fc59cf9cc9/resourcegroups/corp-dev-rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/efmdeviduiavaqbizf2s7le
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: storageAccount
  dependsOn: [storageAccount, managedIdentity]
  name: guid(resourceGroup().id, managedIdentity.id, contributorRoleDefinition.id, 'ra')
  properties: {
    roleDefinitionId: contributorRoleDefinition.id
    principalId: reference(resourceId('Microsoft.ManagedIdentity/userAssignedIdentities', managedIdentityName), '2018-11-30').principalId
    principalType: 'ServicePrincipal'
  }
}

resource deploymentScript 'Microsoft.Resources/deploymentScripts@2023-08-01' = {
  name: 'deploymentScript-${location}'
  location: location
  kind: 'AzurePowerShell'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  dependsOn: [
    // we need to ensure we wait for the role assignment to be deployed before trying to access the storage account
    roleAssignment
  ]
  properties: {
    azPowerShellVersion: '11.0'
    scriptContent: loadTextContent('./enable-static-website.ps1')
    retentionInterval: 'PT4H'
    environmentVariables: [
      {
        name: 'ResourceGroupName'
        value: resourceGroup().name
      }
      {
        name: 'StorageAccountName'
        value: storageAccount.name
      }
      {
        name: 'IndexDocumentPath'
        value: indexDocumentPath
      }
      {
        name: 'IndexDocumentContents'
        value: indexDocumentContents
      }
      {
        name: 'ErrorDocument404Path'
        value: errorDocument404Path
      }
      {
        name: 'ErrorDocument404Contents'
        value: errorDocument404Contents
      }
    ]
  }
}

output storageAccountName string = storageAccount.name
output storageAccountLocation string = storageAccount.location
output storageAccountPrimaryEndpointWeb string = storageAccount.properties.primaryEndpoints.web
output storageAccountSecondaryEndpointWeb string = storageAccount.properties.secondaryEndpoints.web
