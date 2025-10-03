// == PARAMETERS ==

// storage account
@description('Storage Account location.')
param location string
@minLength(3)
@maxLength(24)
@description('Storage Account name.')
param storageAccountName string
@description('Storage Account Sku')
@allowed([
  'Standard_LRS'
  'Standard_GRS'
  'Standard_RAGRS'
  'Standard_RAGZRS'
  'Standard_ZRS'
  'Premium_LRS'
])
param storageAccountSku string

// storage account management policies
@description('Define Lifecycle Management Policy for the storage account?')
param enableManagementPolicy bool
@description('Number of days to retain the blob in the storage account.')
param deleteAfterNDaysList array

@description('Tags')
param tags object

// == RESOURCES ==

// storage account
resource storageAccount 'Microsoft.Storage/storageAccounts@2025-01-01' = {
  name: storageAccountName
  sku: {
    name: storageAccountSku
  }
  tags: tags
  kind: 'StorageV2'
  location: location
  properties: {
    supportsHttpsTrafficOnly: true  
    allowBlobPublicAccess: true
    minimumTlsVersion: 'TLS1_2'
  }
}

// storage account management policies
resource storageAccountManagementPolicy 'Microsoft.Storage/storageAccounts/managementPolicies@2025-01-01' = if (enableManagementPolicy) {
  name: 'default'
  parent: storageAccount
  properties: {
    policy: {
      rules: [for deleteAfterNDays in deleteAfterNDaysList: {
        name: 'delete-greater-than-${deleteAfterNDays}-days'
        enabled: true
        type: 'Lifecycle'
        definition: {
          filters: {
            blobTypes: [
              'blockBlob'
            ]
            blobIndexMatch: [
              {
                name: 'deleteAfterDays'
                op: '=='
                value: '${deleteAfterNDays}'
              }
            ]
          }
          actions: {
            baseBlob: {
              delete: {
                daysAfterCreationGreaterThan: deleteAfterNDays
              }
            }
          }
        }          
      }]
    }
  }
}


// == OUTPUTS ==

output storageAccountName string = storageAccount.name
output storageAccountId string = storageAccount.id
