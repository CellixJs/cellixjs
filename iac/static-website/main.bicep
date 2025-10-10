// params
@maxLength(3)
param applicationPrefix string

@maxLength(3)
param environment string

@allowed([
  'westus3'
  'eastus2'
])
param storageAccountLocation string

@description('The storage account sku name.')
@allowed([
  'Standard_LRS'
  'Standard_GRS'
  'Standard_ZRS'
  'Premium_LRS'
  'Standard_RAGZRS'
])
param storageAccountSku string

@maxLength(3)
param instanceName string

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
@description('Tags')
param tags object

@allowed([
  'Blob'
  'Container'
  'None'
])
@description('Specifies whether data in the container may be accessed publicly and the level of access.')
param publicAccessLevel string = 'None'
@description('specify cdn profile to associate with the storage account')

// variables
var uniqueId = uniqueString(resourceGroup().id)
var storageAccountName = '${resourceNamingConvention.outputs.smallPrefix}${resourceNamingConvention.outputs.resourceTypes.storageAccount}${instanceName}${uniqueId}'

// resource naming convention
module resourceNamingConvention '../global/resource-naming-convention.bicep' = {
  name: 'resourceNamingConventionModule'
  params: {
    environment: environment
    applicationPrefix: applicationPrefix
  }
}

// storage account
module storageAccountModule './storage-account.bicep' = {
  name: '${applicationPrefix}${instanceName}storageAccountModule'
  params: {
    storageAccountName: storageAccountName
    location: storageAccountLocation
    sku: storageAccountSku
    corsAllowedMethods: corsAllowedMethods
    corsAllowedOrigins: corsAllowedOrigins
    corsAllowedHeaders: corsAllowedHeaders
    corsExposedHeaders: corsExposedHeaders
    corsMaxAgeInSeconds: corsMaxAgeInSeconds
    tags: tags
    managedIdentityName: '${resourceNamingConvention.outputs.smallPrefix}${resourceNamingConvention.outputs.resourceTypes.managedIdentity}${instanceName}${uniqueId}'
    publicAccessLevel: publicAccessLevel
  }
}

// // cdn
// module cdnModule './cdn.bicep' = {
//   name: '${applicationPrefix}${instanceName}cdnModule'
//   dependsOn: [storageAccountModule]
//   params: {
//     applicationPrefix: applicationPrefix
//     cdnProfileName: cdnProfileName
//     cdnRules: cdnRules
//     cdnEndpointName: '${resourceNamingConvention.outputs.prefix}${resourceNamingConvention.outputs.resourceTypes.cdnEndpoint}-${instanceName}-${uniqueId}'
//     storageAccountPrimaryHostName: replace(replace(storageAccountModule.outputs.storageAccountPrimaryEndpointWeb, 'https://', ''), '/','')
//     storageAccountSecondaryHostName: replace(replace(storageAccountModule.outputs.storageAccountSecondaryEndpointWeb, 'https://', ''), '/','')
//     customDomainName: customDomainName
//     tags: tags
//   }
// }

output storageAccountName string = storageAccountModule.outputs.storageAccountName
