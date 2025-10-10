//PARAMETERS
@maxLength(3)
param applicationPrefix string
param location string
param tags object
param appServicePlanName string
param storageAccountName string
param functionAppInstanceName string
param functionWorkerRuntime string = 'node'
@description('The version of the Functions runtime that hosts your function app.')
param functionExtensionVersion string = '~4'
@description('The maximum memory size of V8 old memory section.')
param maxOldSpaceSizeMB int = 2048 // Default is 2048 MB, can be adjusted based on function app requirements
@description('Linux App Framework and Version')
param linuxFxVersion string = 'NODE|20' // Specify the Node.js version for the function app
@description('Function App Allowed Origins')
param allowedOrigins array
@description('Key Vault Name')
param keyVaultName string
param env string

// variables
var uniqueId = uniqueString(resourceGroup().id)
var moduleNameSuffix = '-Module-${applicationPrefix}-${env}-func-${functionAppInstanceName}'


// resource naming convention
module resourceNamingConvention '../global/resource-naming-convention.bicep' = {
  name: 'resourceNamingConvention${moduleNameSuffix}'
  params: {
    environment: env
    applicationPrefix: applicationPrefix
  }
}

var functionAppName = '${resourceNamingConvention.outputs.prefix}${resourceNamingConvention.outputs.resourceTypes.functionApp}-${functionAppInstanceName}-${uniqueId}'


// app service plan for function app
resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' existing = {
  name: appServicePlanName
}

// storage account
resource storageAccount 'Microsoft.Storage/storageAccounts@2022-05-01' existing = {
  name: storageAccountName
}

module functionApp 'br/public:avm/res/web/site:0.19.3' = {
  name: 'functionAppDeployment'
  params: {
    name: functionAppName
    location: location
    tags: tags
    kind: 'functionapp'
    serverFarmResourceId: appServicePlan.id
    httpsOnly: true
    managedIdentities: {
      systemAssigned: true
    }
    configs: [
      {
        name: 'appsettings'
        properties: {
          FUNCTIONS_WORKER_RUNTIME: functionWorkerRuntime
          FUNCTIONS_EXTENSION_VERSION: functionExtensionVersion
          AzureWebJobsStorage: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
          WEBSITE_CONTENTAZUREFILECONNECTIONSTRING: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
          WEBSITES_CONTAINER_START_TIME_LIMIT: '1800'
          ENABLE_ORYX_BUILD: 'false'
          SCM_DO_BUILD_DURING_DEPLOYMENT: 'false'
          WEBSITE_RUN_FROM_PACKAGE: '1'
          languageWorkers__node__arguments: '--max-old-space-size=${maxOldSpaceSizeMB}' // Set max memory size for V8 old memory section
        }
      }
      {
        name: 'web'
        properties: {
          ipSecurityRestrictions: [
            {
              ipAddress: 'AzureFrontDoor.Backend'
              action: 'Allow'
              tag: 'ServiceTag'
              priority: 100
              name: 'Allow Front Door Only'
              description: 'Allow traffic through Front Door only'
            }
            {
              ipAddress: 'Any'
              action: 'Deny'
              priority: 2147483647
              name: 'Deny all'
              description: 'Deny all access'
          }
        ]
        scmIpSecurityRestrictions: [
          {
            ipAddress: 'Any'
            action: 'Allow'
            priority: 2147483647
            name: 'Allow all'
            description: 'Allow all access'
          }
        ]
        scmIpSecurityRestrictionsUseMain: false
      }
    }
  ]
    siteConfig: {
      alwaysOn: true
      linuxFxVersion: linuxFxVersion // Specify the Node.js version for the function app
      localMySqlEnabled: false
      netFrameworkVersion: null
      cors: {
        allowedOrigins: allowedOrigins 
        supportCredentials: true
      }
    }
  }
}

// Key Vault role assignment module
module keyVaultRoleAssignment 'key-vault-role-assignment.bicep' = {
  name: 'keyVaultRoleAssignment${moduleNameSuffix}'
  params: {
    keyVaultName: keyVaultName
    principalId: functionApp.outputs.systemAssignedMIPrincipalId!
    principalType: 'ServicePrincipal'
  }
}

// Outputs
output functionAppNamePri string = functionApp.outputs.name
output systemAssignedMIPrincipalId string = functionApp.outputs.systemAssignedMIPrincipalId!
output keyVaultRoleAssignmentId string = keyVaultRoleAssignment.outputs.roleAssignmentId
