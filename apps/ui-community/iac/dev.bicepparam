using './main.bicep'

param environment = 'dev'

param instanceName = 'uic'
param applicationPrefix ='ocm'
param storageAccountLocation = 'eastus2'
param storageAccountSku = 'Standard_RAGZRS'
// param cdnRules = [
//   {
//     name: 'Global'
//     order: '0'
//     actions: [
//       {
//         name: 'ModifyResponseHeader'
//         parameters: {
//           headerAction: 'Append'
//           headerName: 'X-Frame-Options'
//           value: 'SAMEORIGIN'
//           typeName: 'DeliveryRuleHeaderActionParameters'
//         }
//       }
//       {
//         name: 'ModifyResponseHeader'
//         parameters: {
//           headerAction: 'Delete'
//           headerName: 'Server'
//           value: null
//           typeName: 'DeliveryRuleHeaderActionParameters'
//         }
//       }
//       {
//         name: 'ModifyResponseHeader'
//         parameters: {
//           headerAction: 'Append'
//           headerName: 'Content-Security-Policy'
//           value: 'default-src https: \'unsafe-eval\' \'unsafe-inline\' www.googletagmanager.com data:; img-src \'self\' ahpdevstappavaqbizf2s7le.blob.core.windows.net data: blob:;'
//           typeName: 'DeliveryRuleHeaderActionParameters'
//         }
//       }
//       {
//         name: 'ModifyResponseHeader'
//         parameters: {
//           headerAction: 'Append'
//           headerName: 'X-Content-Type-Options'
//           value: 'nosniff'
//           typeName: 'DeliveryRuleHeaderActionParameters'
//         }
//       }
//     ]
//   }
//   {
//     name: 'Global2'
//     order: '1'
//     conditions: [
//       {
//         name: 'RequestScheme'
//         parameters: {
//           matchValues: [
//             'HTTPS'
//           ]
//           negateCondition: false
//           operator: 'Equal'
//           typeName: 'DeliveryRuleRequestSchemeConditionParameters'
//         }
//       }
//     ]
//     actions: [
//       {
//         name: 'ModifyResponseHeader'
//         parameters: {
//           headerAction: 'Append'
//           headerName: 'Strict-Transport-Security'
//           value: 'max-age=31536000; includeSubDomains; preload'
//           typeName: 'DeliveryRuleHeaderActionParameters'
//         }
//       }
//       {
//         name: 'ModifyResponseHeader'
//         parameters: {
//           headerAction: 'Append'
//           headerName: 'Referrer-Policy'
//           value: 'no-referrer'
//           typeName: 'DeliveryRuleHeaderActionParameters'
//         }
//       }
//       {
//         name: 'ModifyResponseHeader'
//         parameters: {
//           headerAction: 'Append'
//           headerName: 'Content-Security-Policy'
//           value: 'script-src \'self\' \'unsafe-eval\' https://flex.cybersource.com cdnjs.cloudflare.com www.googletagmanager.com '
//           typeName: 'DeliveryRuleHeaderActionParameters'
//         }
//       }
//     ]
//   }
//   {
//     name: 'Global3'
//     order: '2'
//     conditions: [
//       {
//         name: 'RequestScheme'
//         parameters: {
//           matchValues: [
//             'HTTPS'
//           ]
//           negateCondition: false
//           operator: 'Equal'
//           typeName: 'DeliveryRuleRequestSchemeConditionParameters'
//         }
//       }
//     ]
//     actions: [
//       {
//         name: 'ModifyResponseHeader'
//         parameters: {
//           headerAction: 'Append'
//           headerName: 'Content-Security-Policy'
//           value: '\'sha256-qUq/ZIZbcOS3Du8xAcS+2v6g+YZfZ7QbulaQ4BvWakQ=\';worker-src blob: data:;'
//           typeName: 'DeliveryRuleHeaderActionParameters'
//         }
//       }
//     ]
//   }
// ]
// param customDomainName = ''
param corsAllowedMethods = ['GET', 'POST']
param corsAllowedOrigins = []
param corsAllowedHeaders = []
param corsExposedHeaders = []
param corsMaxAgeInSeconds = 0
param tags = {
  environment: environment
  application: applicationPrefix
}
// param cdnProfileName = 'cell-fd'
