using './main.bicep'

param environment = 'dev'

param instanceName = 'uis'
param applicationPrefix ='ocm'
param storageAccountLocation = 'eastus2'
param storageAccountSku = 'Standard_LRS'
param corsAllowedMethods = ['GET', 'POST']
param corsAllowedOrigins = []
param corsAllowedHeaders = []
param corsExposedHeaders = []
param corsMaxAgeInSeconds = 0
param tags = {
  environment: environment
  application: applicationPrefix
}
