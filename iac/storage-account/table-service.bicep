// == PARAMETERS ==

// storage account
@minLength(3)
@maxLength(24)
@description('Storage Account name.')
param storageAccountName string

// tables
@description('Array of Table names')
param tables array


// == RESOURCES ==

// storage account
resource storageAccount 'Microsoft.Storage/storageAccounts@2025-01-01' existing = {
  name: storageAccountName
}

// table service
resource tableService 'Microsoft.Storage/storageAccounts/tableServices@2025-01-01' = {
  name: 'default'
  parent: storageAccount
}


// tables
resource table 'Microsoft.Storage/storageAccounts/tableServices/tables@2025-01-01' = [for tableRecord in tables: {
  name: tableRecord.name
  parent: tableService
}]
