// == PARAMETERS ==

// storage account
@minLength(3)
@maxLength(24)
@description('Storage Account name.')
param storageAccountName string

// queues
@description('Array of Queue names')
param queues array


// == RESOURCES ==

// storage account
resource storageAccount 'Microsoft.Storage/storageAccounts@2025-01-01' existing = {
  name: storageAccountName
}

// queue service
resource queueService 'Microsoft.Storage/storageAccounts/queueServices@2025-01-01' = {
  name: 'default'
  parent: storageAccount
}

// queues
resource queue 'Microsoft.Storage/storageAccounts/queueServices/queues@2025-01-01' = [for queue in queues: {
  name: queue.name
  parent: queueService
}]
