param applicationPrefix string
param appServicePlanName string
param location string
param appServicePlanOperatingSystem string
param appServicePlanSku string
param tags object
param storageAccountName string
param functionAppInstanceName string
param functionWorkerRuntime string 
param functionExtensionVersion string
param maxOldSpaceSizeMB int 
param linuxFxVersion string
param allowedOrigins array
param keyVaultName string
param env string
param cosmosMongoDBInstanceName string 
param totalThroughputLimit int
param backupIntervalInMinutes int
param backupRetentionIntervalInHours int
param maxThroughput int
param runRbacRoleAssignment bool
param rbacMembers array
param enableAnalyticalStorage bool

module appServicePlan '../../../iac/app-service-plan/main.bicep' = {
  name: 'appServicePlan'
  params: {
    appServicePlanName: appServicePlanName
    location: location
    operatingSystem: appServicePlanOperatingSystem
    tags: tags
    sku: appServicePlanSku
  }
}

module functionApp '../../../iac/function-app/main.bicep' = {
  name: 'functionApp'
  params: {
    applicationPrefix: applicationPrefix
    location: location
    tags: tags
    appServicePlanName: appServicePlanName
    storageAccountName: storageAccountName
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

module cosmosMongoDB '../../../iac/cosmos-mongodb/main.bicep' = {
  name: 'cosmosMongoDB'
  params: {
    applicationPrefix: applicationPrefix
    environment: env
    location: location
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
