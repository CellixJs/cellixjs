@minLength(3)
@maxLength(44)
@description('name of the MongoDB account')
param mongoDatabaseAccountName string

@description('location of the MongoDB')
param location string

@description('totalThroughputLimit of the MongoDB')
param totalThroughputLimit int

@description('backupIntervalInMinutes of the MongoDB')
param backupIntervalInMinutes int

@description('backupRetentionIntervalInHours of the MongoDB')
param backupRetentionIntervalInHours int

@description('tags')
param tags object

@description('run action groups')
param runRbacRoleAssignment bool = false

@description('role assignment members')
param members array

@description('enableAnalyticalStorage of the MongoDB')
param enableAnalyticalStorage bool

resource mongoDatabaseAccount 'Microsoft.DocumentDB/databaseAccounts@2025-05-01-preview' = {
  name: mongoDatabaseAccountName
  location: location
  tags: tags
  kind: 'MongoDB'
  identity: {
    type: 'None'
  }
  properties: {
    publicNetworkAccess: 'Enabled'
    enableAutomaticFailover: false
    enableMultipleWriteLocations: false
    isVirtualNetworkFilterEnabled: false

    virtualNetworkRules: []
    disableKeyBasedMetadataWriteAccess: false
    enableFreeTier: false
    enableAnalyticalStorage: enableAnalyticalStorage
    analyticalStorageConfiguration: {
      schemaType: 'FullFidelity'
    }
    databaseAccountOfferType: 'Standard'
    defaultIdentity: 'FirstPartyIdentity'
    networkAclBypass: 'None'
    disableLocalAuth: false
    enablePartitionMerge: false
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
      maxIntervalInSeconds: 5
      maxStalenessPrefix: 100
    }

    apiProperties: {
      serverVersion: '4.2'
    }
    locations: [
      {
        locationName: location
        // provisioningState: 'Succeeded'
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    cors: []
    capabilities: [
      {
        name: 'EnableMongo'
      }
      {
        name: 'DisableRateLimitingResponses'
      }
      {
        name: 'EnableMongoRoleBasedAccessControl'
      }
    ]
    ipRules: []
    backupPolicy: {
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: backupIntervalInMinutes
        backupRetentionIntervalInHours: backupRetentionIntervalInHours
        backupStorageRedundancy: 'Geo'
      }
    }
    networkAclBypassResourceIds: []
    capacity: {
      totalThroughputLimit: totalThroughputLimit
    }
    // keysMetadata: {
    // }
  }
}

// create a custom role named 'Cosmos DB GetConnectionStrings' with the permission to get connection strings
resource cosmosDBGetConnectionStringsRole 'Microsoft.Authorization/roleDefinitions@2022-05-01-preview' = {
  name: guid('Cosmos DB GetConnectionStrings ${mongoDatabaseAccountName}')
  properties: {
    roleName: 'Cosmos DB GetConnectionStrings ${mongoDatabaseAccountName}'
    description: 'Role to get connection strings of ${mongoDatabaseAccountName} Cosmos DB resource'
    type: 'CustomRole'
    assignableScopes: [
      mongoDatabaseAccount.id
    ]
    permissions: [
      {
        actions: [
          'Microsoft.DocumentDB/databaseAccounts/listConnectionStrings/action'
        ]
        notActions: []
        dataActions: []
        notDataActions: []
      }
    ]
  }
}

// assign the custom role to the security group called 'Connected Apps Developer'
resource cosmosDBGetConnectionStringsRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = [
  for member in members: if (runRbacRoleAssignment == true) {
    scope: mongoDatabaseAccount
    name: guid('Cosmos DB GetConnectionStrings ${mongoDatabaseAccountName} ${member.principalId}')
    properties: {
      roleDefinitionId: cosmosDBGetConnectionStringsRole.id
      principalId: member.principalId
      principalType: member.principalType
    }
  }
]

output mongoDatabaseAccountName string = mongoDatabaseAccount.name
