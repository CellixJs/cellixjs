@description('CDN Name')
@maxLength(260)
param cdnProfileName string
@description('CDN endpoint name')
@maxLength(50)
param cdnEndpointName string
@description('Storage Account Primary Hostname')
param storageAccountPrimaryHostName string
@description('Storage Account Secondary Hostname')
param storageAccountSecondaryHostName string
@description('Application Prefix')
param applicationPrefix string
@description('custom domain name')
param customDomainName string
@description('Tags')
param tags object
@description('cdn rules')
param cdnRules array
// @description('primary CDN originName')
// param primaryCdnOriginName string
// @description('secondary CDN originName')
// param secondaryCdnOriginName string

// @description('CDN Host Name, comes from storage account primary endpoint or secondary endpoint')
// param primaryCdnHostName string
// @description('CDN Host Name, comes from storage account primary endpoint or secondary endpoint')
// param secondaryCdnHostName string
// @description('Origin Group Name')
// param originGroupName string


@description('CDN Profile')
resource cdnProfile 'Microsoft.Cdn/profiles@2025-06-01' existing = {
  name: cdnProfileName
}

var primaryCdnOriginName = replace(storageAccountPrimaryHostName, '.', '-')
var secondaryCdnOriginName = replace(storageAccountSecondaryHostName, '.', '-')
var cdnOriginGroupName = '${applicationPrefix}-ogn'

resource cdnEndpoint 'Microsoft.Cdn/profiles/endpoints@2025-06-01' = {
  parent: cdnProfile
  dependsOn: [cdnProfile]
  tags: tags
  name: cdnEndpointName
  location: 'Global'
  properties: {
    isHttpAllowed: true
    isHttpsAllowed: true
    isCompressionEnabled: true
    queryStringCachingBehavior: 'IgnoreQueryString'
    contentTypesToCompress: json(loadTextContent('content-types.json'))
    origins: [
      {
        name: primaryCdnOriginName
        properties: {
          hostName: storageAccountPrimaryHostName
          httpPort: 80
          httpsPort: 443
          originHostHeader: storageAccountPrimaryHostName
          priority: 1
          weight: 1000
          enabled: true
        }
      }
      {
        name: secondaryCdnOriginName
        properties: {
          hostName: storageAccountSecondaryHostName
          originHostHeader: storageAccountSecondaryHostName
          priority: 2
          weight: 1000
          enabled: true
        }
      }
    ]
    deliveryPolicy:{
      description:''
      rules: cdnRules
    }
    originGroups: [
      {
        name: cdnOriginGroupName
        properties: {
          healthProbeSettings: {
            probePath: '/'
            probeRequestType: 'GET'
            probeProtocol: 'Https'
            probeIntervalInSeconds: 240
          }
          origins: [
            {
              id: resourceId('Microsoft.Cdn/profiles/endpoints/origins', cdnProfileName, cdnEndpointName, primaryCdnOriginName)
            }
            {
              id: resourceId('Microsoft.Cdn/profiles/endpoints/origins', cdnProfileName, cdnEndpointName, secondaryCdnOriginName)
            }
          ]
        }
      }
    ]
    defaultOriginGroup: {
      id: resourceId('Microsoft.Cdn/profiles/endpoints/origingroups', cdnProfileName, cdnEndpointName, cdnOriginGroupName)
    }
  }
}

resource customDomain 'Microsoft.Cdn/profiles/endpoints/customDomains@2021-06-01' = {
  parent: cdnEndpoint
  name: replace(customDomainName, '.', '-')
  properties: {
    hostName: customDomainName
  }
}
