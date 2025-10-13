// params
@allowed([
  'prd' //resource group is corp-prd-rg
  'uat' //resource group is corp-uat-rg
  'qa'  //resource group is corp-qa-rg
  'dev' //resource group is corp-dev-rg
  'cor' //resource group is corp-core-rg
  'trn' //resource group is corp-trn-rg
])
param environment string

param instanceName string
param applicationPrefix string
param storageAccountLocation string
param storageAccountSku string
// param cdnRules array
// param customDomainName string
param corsAllowedMethods array
param corsAllowedOrigins array
param corsAllowedHeaders array
param corsExposedHeaders array
param corsMaxAgeInSeconds int
param tags object
// param cdnProfileName string




// static website
module staticWebsite '../../../iac/static-website/main.bicep' = {
  name: 'staticWebsiteModule-${instanceName}'
  params: {
    applicationPrefix: applicationPrefix
    instanceName: instanceName
    environment: environment
    storageAccountLocation: storageAccountLocation
    storageAccountSku: storageAccountSku
    corsAllowedMethods: corsAllowedMethods
    corsAllowedOrigins: corsAllowedOrigins
    corsAllowedHeaders: corsAllowedHeaders
    corsExposedHeaders: corsExposedHeaders
    corsMaxAgeInSeconds: corsMaxAgeInSeconds
    tags: tags
    // cdnProfileName: cdnProfileName
    // cdnRules: cdnRules
    // customDomainName: customDomainName
  }
}

// Outputs
output storageAccountName string = staticWebsite.outputs.storageAccountName
