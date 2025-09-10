using './main.bicep'

param env = 'dev'
param applicationPrefix = 'cel'
param appServicePlanName = 'pri-001'
param location = 'eastus2'
param tags = {
  environment: 'dev'
  application: 'cel'
}

//function app
param appServicePlanSku = 'EP1'
param appServicePlanOperatingSystem = 'linux' 
param storageAccountName = 'celdevstfunceastus2'
param functionAppInstanceName = 'pri'
param functionWorkerRuntime = 'node' 
param functionExtensionVersion = '~4' 
param maxOldSpaceSizeMB = 3072
param linuxFxVersion = 'NODE|20'
param allowedOrigins = [

]
param keyVaultName = 'corp-dev-kv'


//cosmos
param cosmosMongoDBInstanceName = 'dat'
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


