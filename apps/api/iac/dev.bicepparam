using './main.bicep'

param env = 'dev'
param applicationPrefix = 'ocm'
param tags = {
  environment: 'dev'
  application: 'ocm'
}

//app service plan
param appServicePlanName = 'pri-001'
param appServicePlanLocation = 'eastus2'
param appServicePlanSku = 'B1'
param appServicePlanOperatingSystem = 'linux'

//function app
param functionAppStorageAccountName = 'cxadevfunceastus2'
param functionAppLocation = 'eastus2'
param functionAppInstanceName = 'pri'
param functionWorkerRuntime = 'node'
param functionExtensionVersion = '~4'
param maxOldSpaceSizeMB = 3072
param linuxFxVersion = 'NODE|22'
param allowedOrigins = [
  'https://ocm-fde-ged3a8gxcvfxafaf.z02.azurefd.net'
]
param keyVaultName = 'sharethrift-keyvault'

//storage account
param storageAccountName = 'app'
param storageAccountLocation = 'eastus2'
param storageAccountSku = 'Standard_RAGZRS'
param storageAccountManagementPolicy = {
  enable: false
  deleteAfterNDaysList: []
}
param enableBlobService = true
param containers = [
  {
    name: 'public'
    publicAccess: 'blob'
  }
  {
    name: 'private'
    publicAccess: 'None'
  }
]
param enableQueueService = true
param queues = []
param cors = {
  allowedOrigins: [
    'https://ocm-fde-ged3a8gxcvfxafaf.z02.azurefd.net'
  ]
  allowedMethods: [
    'GET'
    'POST'
    'PUT'
    'OPTIONS'
  ]
  allowedHeaders: [
    '*'
  ]
  exposedHeaders: [
    'x-ms-version-id'
  ]
  maxAgeInSeconds: 0
}
param enableTableService = false
param isVersioningEnabled = true
param tables = []


//cosmos
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
