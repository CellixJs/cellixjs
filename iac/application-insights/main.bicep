//PARAMETERS
@maxLength(3)
@description('Application prefix for resource naming')
param applicationPrefix string
@description('Location for the Application Insights resource')
param location string
@description('Tags to apply to the Application Insights resource')
param tags object
@description('Environment name (e.g., dev, prod)')
param env string

// variables
var prefix = '${applicationPrefix}-${env}-'
var resourceTypes = loadJsonContent('../global/resource-types.json')
var applicationInsightsName = '${prefix}${resourceTypes.applicationInsights}'

// application insights
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: applicationInsightsName
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Flow_Type: 'Bluefield'
    Application_Type: 'web'
    Request_Source: 'rest'
  }
}

// Outputs
output connectionString string = applicationInsights.properties.ConnectionString
