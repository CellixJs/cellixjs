// == PARAMETERS ==

// storage account
@minLength(3)
@maxLength(24)
@description('Storage Account name.')
param storageAccountName string

// blob containers
@description('Array of Container objects')
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

// == RESOURCES ==

// storage account
resource storageAccount 'Microsoft.Storage/storageAccounts@2025-01-01' existing = {
  name: storageAccountName
}

// blob service
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2025-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
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
      allowPermanentDelete: false
      enabled: false
    }
    isVersioningEnabled: isVersioningEnabled
  }
}

// blob containers
resource blobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2025-01-01' = [for container in containers: {
  name: container.name
  parent: blobService
  properties: {
    publicAccess: container.publicAccess
  }
}]
