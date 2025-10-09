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
  'https://ocm-dev-fde-uic-f6g9crbzb0akh5c3.z02.azurefd.net'
] //Specify the frontend endpoints that can access the function app
param keyVaultName = 'sharethrift-keyvault'
param functionAppInstanceName = 'pri'
param applicationPrefix = 'ocm'
param env = 'dev'
