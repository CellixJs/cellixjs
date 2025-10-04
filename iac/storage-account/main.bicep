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
//var moduleNameSuffix = '-Module-${applicationPrefix}-${environment}-st-${instanceName}'
var moduleNameSuffix = '-Module-${applicationPrefix}-${environment}-st-${instanceName}'


// resource naming convention
module resourceNamingConvention '../global/resource-naming-convention.bicep' = {
  name: 'resourceNamingConvention${moduleNameSuffix}'
  params: {
    environment: environment
    applicationPrefix: applicationPrefix
  }
}

// storage account
module storageAccount './storage-account.bicep' = {
  name: 'storageAccount${moduleNameSuffix}'
  params: {
    location: location
    storageAccountName:'${resourceNamingConvention.outputs.smallPrefix}${resourceNamingConvention.outputs.resourceTypes.storageAccount}${instanceName}${uniqueId}'
    storageAccountSku: storageAccountSku
    tags: tags
    enableManagementPolicy: enableManagementPolicy
    deleteAfterNDaysList: deleteAfterNDaysList
  }
}

// blob service
module blobService './blob-service.bicep' = if(enableBlobService) {
  name: 'blobService${moduleNameSuffix}'
  params: {
    storageAccountName: storageAccount.outputs.storageAccountName
    containers: containers
    corsAllowedOrigins: corsAllowedOrigins
    corsAllowedMethods: corsAllowedMethods
    corsAllowedHeaders: corsAllowedHeaders
    corsExposedHeaders: corsExposedHeaders
    corsMaxAgeInSeconds: corsMaxAgeInSeconds
    isVersioningEnabled: isVersioningEnabled
  }
}

// queue service
module queueService './queue-service.bicep' = if(enableQueueService) {
  name: 'queueService${moduleNameSuffix}'
  params: {
    storageAccountName: storageAccount.outputs.storageAccountName
    queues: queues
  }
}

// table service
module tableService './table-service.bicep' = if(enableTableService) {
  name: 'tableService${moduleNameSuffix}'
  params: {
    storageAccountName: storageAccount.outputs.storageAccountName
    tables: tables
  }
}
