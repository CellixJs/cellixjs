// == PARAMETERS ==
@description('Application prefix for resource naming')
param applicationPrefix string

@description('Environment (dev, qa, prod)')
param environment string

@description('Instance name for the app service plan')
param instanceName string

@description('Resource location')
param location string = resourceGroup().location

@description('App Service Plan SKU')
@allowed([
  //name  Tier          Full name
  'D1'  //Shared      an D1 Shared
  'F1'   //Free        an F1 Free
  'B1'   //Basic       an B1 Basic
  'B2'   //Basic       an B2 Basic
  'B3'   //Basic       an B3 Basic
  'S1'   //Standard    an S1 Standard
  'S2'   //Standard    an S2 Standard
  'S3'   //Standard    an S3 Standard
  'P1'   //Premium     an P1 Premium
  'P2'   //Premium     an P2 Premium
  'P3'   //Premium     an P3 Premium
  'P1V2' //PremiumV2   an P1V2 PremiumV2
  'P2V2' //PremiumV2   an P2V2 PremiumV2
  'P3V2' //PremiumV2   an P3V2 PremiumV2
  'I1'   //Isolated    an I2 Isolated
  'I2'   //Isolated    an I2 Isolated
  'I3'   //Isolated    an I3 Isolated
  'Y1'   //Dynamic     a  function consumption plan
  'EP1'  //ElasticPremium
  'EP2'  //ElasticPremium
  'EP3'   //ElasticPremium
])
param sku string
@description('App Service Plan Operating System')
@allowed([
  'linux'
  // 'windows'  // commenting this because windows configuration is not known at this time
])
param operatingSystem string = 'linux'

@description('Resource tags')
param tags object = {}

// == VARIABLES ==
var appServicePlanName = '${applicationPrefix}-${environment}-asp-${instanceName}'

// == RESOURCES ==
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  kind: operatingSystem
  sku: {
    name: sku
  }
  properties: {
    reserved: operatingSystem == 'linux'
    zoneRedundant: false
  }
}

// == OUTPUTS ==
@description('The resource ID of the App Service Plan')
output appServicePlanId string = appServicePlan.id

@description('The name of the App Service Plan')
output appServicePlanName string = appServicePlan.name

@description('The location of the App Service Plan')
output location string = appServicePlan.location

