using './main.bicep'

param env = 'dev'
param applicationPrefix = 'cel'
param tags = {
  environment: 'dev'
  application: 'cel'
}

// app service plan
param appServicePlanName = 'pri-001'
param appServicePlanLocation = 'eastus2'
param appServicePlanSku = 'B2'
param appServicePlanOperatingSystem = 'linux'

// function app
param functionAppStorageAccountName = 'celdevstfunceastus2'
param functionAppLocation = 'eastus2'
param functionAppInstanceName = 'pri'
param functionWorkerRuntime = 'node'
param functionExtensionVersion = '~4'
param maxOldSpaceSizeMB = 3072
param linuxFxVersion = 'NODE|22'
param allowedOrigins = [

]
param keyVaultName = 'sharethrift-keyvault'

// cosmos
param cosmosMongoDBInstanceName = 'dat'
param cosmosLocation = 'eastus2'
param totalThroughputLimit = 3200
param backupIntervalInMinutes = 240
param backupRetentionIntervalInHours = 96
param maxThroughput = 1000
param runRbacRoleAssignment = false
param enableAnalyticalStorage = true
param rbacMembers = [
  {
    identityName: 'Azure Pri Function App System assigned Identity'
    principalId: 'd1bd630a-64c3-415a-a7fa-0d61ec79505d'
    principalType: 'ServicePrincipal'
  }
  {
    identityName: 'Azure Sec Function App System assigned Identity'
    principalId: 'c5a8b5b3-2d29-4c9c-a6de-5f4dda8b5d1d'
    principalType: 'ServicePrincipal'
  }
]
