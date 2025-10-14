using './main.bicep'

param appServicePlanName = 'asp-pri-001'
param location = 'eastus2'
param tags = {
  environment: 'dev'
  application: 'cellixjs'
}
param storageAccountName = 'cxadevstfunceastus2'
param maxOldSpaceSizeMB = 3072
param functionWorkerRuntime = 'node'
param linuxFxVersion = 'NODE|22' 
param functionExtensionVersion = '~4' 
param allowedOrigins = [
  'https://ownercommunity.org'
] //Specify the frontend endpoints that can access the function app
param keyVaultName = 'sharethrift-keyvault'
param functionAppInstanceName = 'pri'
param applicationPrefix = 'ocm'
param env = 'dev'
