// params
@maxLength(3)
param applicationPrefix string

@maxLength(3)
param environment string

param location string

@description('The storage account sku name.')

@allowed([
  'Standard_LRS'
  'Standard_GRS'
  'Standard_RAGRS'
  'Standard_RAGZRS'
  'Standard_ZRS'
  'Premium_LRS'
])
param storageAccountSku string

@maxLength(3)
param instanceName string

@description('Tags')
param tags object
@description('Define Lifecycle Management Policy for the storage account?')
param enableManagementPolicy bool
@description('Number of days to retain the blob in the storage account.')
param deleteAfterNDaysList array

@description('Enable Blob Service for the storage account?')
param enableBlobService bool
@description('Array of Container objects.')
param containers array
@description('Array of allowed origins for CORS.')
param corsAllowedOrigins array
@description('Array of allowed methods for CORS.')
param corsAllowedMethods array
@description('Array of allowed headers for CORS.')
param corsAllowedHeaders array
@description('Array of exposed headers for CORS.')
param corsExposedHeaders array
@description('Number of seconds to cache the preflight response for CORS.')
param corsMaxAgeInSeconds int

@description('Enable blob versioning')
param isVersioningEnabled bool

@description('Enable Queue Service for the storage account?')
param enableQueueService bool
@description('Array of Queue objects.')
param queues array

@description('Enable Table Service for the storage account?')
param enableTableService bool
@description('Array of Table objects.')
param tables array

// variables
var uniqueId = uniqueString(resourceGroup().id)
var moduleNameSuffix = '-Module-${applicationPrefix}-${environment}-st-${instanceName}'

// resource naming convention
module resourceNamingConvention '../global/resource-naming-convention.bicep' = {
  name: 'resourceNamingConvention${moduleNameSuffix}'
  params: {
    environment: environment
    applicationPrefix: applicationPrefix
  }
}

var storageAccountName = '${resourceNamingConvention.outputs.smallPrefix}${resourceNamingConvention.outputs.resourceTypes.storageAccount}${instanceName}${uniqueId}'

// storage account with AVM
module storageAccount 'br/public:avm/res/storage/storage-account:0.12.0' = {
  name: 'storageAccount${moduleNameSuffix}'
  params: {
    name: storageAccountName
    location: location
    skuName: storageAccountSku
    tags: tags
    publicNetworkAccess: 'Enabled'
    allowSharedKeyAccess: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: true
    enableHierarchicalNamespace: false
    blobServices: enableBlobService ? {
      cors: {
        corsRules: [
          {
            allowedOrigins: corsAllowedOrigins
            allowedMethods: corsAllowedMethods
            allowedHeaders: corsAllowedHeaders
            exposedHeaders: corsExposedHeaders
            maxAgeInSeconds: corsMaxAgeInSeconds
          }
        ]
      }
      deleteRetentionPolicy: {
        enabled: true
        days: 7
      }
      containerDeleteRetentionPolicy: {
        enabled: true
        days: 7
      }
      isVersioningEnabled: isVersioningEnabled
      containers: containers
    } : null
    queueServices: enableQueueService ? {
      cors: {
        corsRules: [
          {
            allowedOrigins: corsAllowedOrigins
            allowedMethods: corsAllowedMethods
            allowedHeaders: corsAllowedHeaders
            exposedHeaders: corsExposedHeaders
            maxAgeInSeconds: corsMaxAgeInSeconds
          }
        ]
      }
      queues: queues
    } : null
    tableServices: enableTableService ? {
      cors: {
        corsRules: [
          {
            allowedOrigins: corsAllowedOrigins
            allowedMethods: corsAllowedMethods
            allowedHeaders: corsAllowedHeaders
            exposedHeaders: corsExposedHeaders
            maxAgeInSeconds: corsMaxAgeInSeconds
          }
        ]
      }
      tables: tables
    } : null
    managementPolicyRules: enableManagementPolicy ? [
      {
        enabled: true
        name: 'DeleteOldBlobs'
        type: 'Lifecycle'
        definition: {
          actions: {
            baseBlob: {
              delete: {
                daysAfterModificationGreaterThan: deleteAfterNDaysList[0]
              }
            }
          }
          filters: {
            blobTypes: [
              'blockBlob'
            ]
          }
        }
      }
    ] : null
  }
}

// Outputs
output storageAccountName string = storageAccount.outputs.name
output storageAccountId string = storageAccount.outputs.resourceId
output storageAccountPrimaryBlobEndpoint string = storageAccount.outputs.primaryBlobEndpoint
