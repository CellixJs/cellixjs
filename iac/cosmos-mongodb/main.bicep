// params
@maxLength(3)
param applicationPrefix string

@maxLength(3)
param environment string

param location string

@description('Total throughput limit for the Cosmos MongoDB Account.')
param totalThroughputLimit int

@description('Backup interval in minutes for the Cosmos MongoDB Account.')
param backupIntervalInMinutes int

@description('Backup retention interval in hours for the Cosmos MongoDB Account.')
param backupRetentionIntervalInHours int

@description('Maximum autoscale throughput for the Cosmos MongoDB Database (RU/s).')
param maxThroughput int

@maxLength(3)
param instanceName string

@description('Tags')
param tags object

@description('run action groups')
param runRbacRoleAssignment bool = false

@description('RBAC Group Ids')
param rbacMembers array

@description('enableAnalyticalStorage of the MongoDB')
param enableAnalyticalStorage bool

// variables
var uniqueId = uniqueString(resourceGroup().id)
var moduleNameSuffix = '-Module-${applicationPrefix}-${environment}-cosmon-${instanceName}'


// resource naming convention
module resourceNamingConvention '../global/resource-naming-convention.bicep' = {
  name: 'resourceNamingConvention${moduleNameSuffix}'
  params: {
    environment: environment
    applicationPrefix: applicationPrefix
  }
}
                    

// cosmos mongodb account
module mongoDatabaseAccount './mongo-database-account.bicep' = {
  name: 'mongoDatabaseAccount${moduleNameSuffix}'
  params: {
    location: location
    mongoDatabaseAccountName: '${resourceNamingConvention.outputs.smallPrefix}${resourceNamingConvention.outputs.resourceTypes.cosmosDbMongoAccount}${instanceName}${uniqueId}'
    totalThroughputLimit: totalThroughputLimit
    backupIntervalInMinutes: backupIntervalInMinutes
    backupRetentionIntervalInHours: backupRetentionIntervalInHours
    tags: tags
    runRbacRoleAssignment: runRbacRoleAssignment
    members: rbacMembers
    enableAnalyticalStorage: enableAnalyticalStorage
  }
}

// cosmos mongodb database
module mongoDatabase './mongo-database.bicep' = {
  name: 'mongoDatabaseModule${instanceName}'
  params: {
    mongoDatabaseAccountName: mongoDatabaseAccount.outputs.mongoDatabaseAccountName
    mongoDatabaseName: '${resourceNamingConvention.outputs.smallPrefix}${resourceNamingConvention.outputs.resourceTypes.cosmosDb}${instanceName}${uniqueId}'
    maxThroughput: maxThroughput
    tags: tags
  }
  dependsOn: [
    mongoDatabaseAccount
  ]
}
