@maxLength(3)
param environment string

@maxLength(3)
param applicationPrefix string

var resourceTypes = loadJsonContent('./resource-types.json')

output smallPrefix string = '${applicationPrefix}${environment}'  // 6 chars length
output prefix string = '${applicationPrefix}-${environment}-'    // 8 chars length
output resourceTypes object = resourceTypes

// Microsoft Resource Naming Conventions
// https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/resource-abbreviations
