@description('name of the MongoDB account')
param mongoDatabaseAccountName string

@description('name of the MongoDB database')
param mongoDatabaseName string

@description('maxThroughput for Autoscale Throughput Settings of the MongoDB database')
param maxThroughput int

@description('Tags')
param tags object

resource mongoDatabaseAccount 'Microsoft.DocumentDB/databaseAccounts@2025-05-01-preview' existing = {
  name: mongoDatabaseAccountName
}
resource mongoDatabase 'Microsoft.DocumentDB/databaseAccounts/mongodbDatabases@2025-05-01-preview' = {
  parent: mongoDatabaseAccount
  name: mongoDatabaseName
  tags: tags
  properties: {
    resource: {
      id: mongoDatabaseName
    }
    options: {
      autoscaleSettings: {
        maxThroughput: maxThroughput
      }
    }
  }
}
