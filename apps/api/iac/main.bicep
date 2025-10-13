param applicationPrefix string
param tags object
param env string

// app service plan
param appServicePlanInstanceName string
param appServicePlanLocation string
param appServicePlanOperatingSystem string
param appServicePlanSku string

// function app
param functionAppLocation string
param functionAppStorageAccountName string
param functionAppInstanceName string
param functionWorkerRuntime string 
param functionExtensionVersion string
param maxOldSpaceSizeMB int 
param linuxFxVersion string
param allowedOrigins array
param keyVaultName string

// cosmos db
param cosmosMongoDBInstanceName string 
param totalThroughputLimit int
param backupIntervalInMinutes int
param backupRetentionIntervalInHours int
param maxThroughput int
param runRbacRoleAssignment bool
param rbacMembers array
param enableAnalyticalStorage bool
param cosmosLocation string

//storage account
param storageAccountName string
param storageAccountLocation string
param storageAccountSku string
param storageAccountManagementPolicy object
param enableBlobService bool
param containers array
param enableQueueService bool
param queues array
param cors object
param enableTableService bool
param isVersioningEnabled bool
param tables array


// variables
var moduleNameSuffix = '-Module-main-${applicationPrefix}-${env}'

module appServicePlan '../../../iac/app-service-plan/main.bicep' = {
  name: 'appServicePlan'
  params: {
    applicationPrefix: applicationPrefix
    environment: env
    instanceName: appServicePlanInstanceName
    location: appServicePlanLocation
    operatingSystem: appServicePlanOperatingSystem
    tags: tags
    sku: appServicePlanSku
  }
}

module functionApp '../../../iac/function-app/main.bicep' = {
  name: 'functionApp'
  params: {
    applicationPrefix: applicationPrefix
    location: functionAppLocation
    tags: tags
    appServicePlanName: appServicePlan.outputs.appServicePlanName
    storageAccountName: functionAppStorageAccountName
    functionAppInstanceName: functionAppInstanceName
    functionWorkerRuntime: functionWorkerRuntime
    functionExtensionVersion: functionExtensionVersion
    maxOldSpaceSizeMB: maxOldSpaceSizeMB
    linuxFxVersion: linuxFxVersion
    allowedOrigins: allowedOrigins
    keyVaultName: keyVaultName
    env: env
  }
}

module storageAccount '../../../iac/storage-account/main.bicep' = {
  name: 'storageAccount${moduleNameSuffix}-${storageAccountName}'
  params: {
    applicationPrefix: applicationPrefix
    environment: env
    instanceName: storageAccountName
    location: storageAccountLocation
    storageAccountSku: storageAccountSku
    enableManagementPolicy: storageAccountManagementPolicy.enable
    deleteAfterNDaysList: storageAccountManagementPolicy.deleteAfterNDaysList
    enableBlobService: enableBlobService
    containers: containers
    enableQueueService: enableQueueService
    queues: queues
    corsAllowedMethods: cors.allowedMethods
    corsAllowedOrigins: cors.allowedOrigins
    corsAllowedHeaders: cors.allowedHeaders
    corsExposedHeaders: cors.exposedHeaders
    corsMaxAgeInSeconds: cors.maxAgeInSeconds
    enableTableService: enableTableService
    isVersioningEnabled: isVersioningEnabled
    tables: tables
    tags: tags
  }
}

module cosmosMongoDB '../../../iac/cosmos-mongodb/main.bicep' = {
  name: 'cosmosMongoDB'
  params: {
    applicationPrefix: applicationPrefix
    environment: env
    location: cosmosLocation
    tags: tags
    instanceName: cosmosMongoDBInstanceName
    totalThroughputLimit: totalThroughputLimit
    backupIntervalInMinutes: backupIntervalInMinutes
    backupRetentionIntervalInHours: backupRetentionIntervalInHours
    maxThroughput: maxThroughput
    runRbacRoleAssignment: runRbacRoleAssignment
    rbacMembers: rbacMembers
    enableAnalyticalStorage: enableAnalyticalStorage


  }
}

// Outputs
output functionAppNamePri string = functionApp.outputs.functionAppNamePri
