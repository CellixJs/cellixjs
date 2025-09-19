 






Notes:

Azure Application Insights is Azure's hosted service for receiving OpenTelemetry

Azure Libraries:


* @azure/monitor-opentelemetry-exporter
  * used to export OpenTelemetry Logs/Metics/Traces to Azure Monitor (Application Insights)
* @azure/monitor-opentelemetry
  * relies on:
    * @azure/monitor-opentelemetry-exporter (^1.0.0-beta.28)
    * @azure/opentelemetry-instrumentation-azure-sdk (^1.0.0-beta.7)






Microsoft as of Mar 28, 2025 currently only supports v1 of the OpenTelemetry at this time - do not use @opentelemetry/sdk-node

* Reference:[GitHub Issue Response from Microsoft](https://github.com/Azure/azure-sdk-for-js/issues/33567#issuecomment-2762721988)

* Instructions Adapated from :[Microsoft's Documentation for Using OpenTelemetry with Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/opentelemetry-howto?tabs=app-insights&pivots=programming-language-typescript) (in previiew as of 3/28/2025)


The following commands will ensure installation of the non 2.x of OTEL:

```console
// npm i -w service-otel @opentelemetry/api@^1.9.0
npm i -w service-otel @opentelemetry/sdk-node@^0.57.2
npm i -w service-otel @azure/functions-opentelemetry-instrumentation
npm i -w service-otel @azure/monitor-opentelemetry-exporter


npm i -w service-otel @opentelemetry/instrumentation-mongoose


npm i -w service-otel @opentelemetry/auto-instrumentations-node@^0.56.0
npm i -w service-otel @azure/monitor-opentelemetry-exporter


npm i -w service-otel @opentelemetry/instrumentation-http@^0.52.1

npm i -w service-otel @opentelemetry/instrumentation-dataloader

npm i -w service-otel @opentelemetry/instrumentation-graphql


npm i -D -w service-otel @tsconfig/node20
npm i -D -w service-otel @tsconfig/node-ts
npm i -D -w service-otel typescript
npm i -D -w @ocom/service-otel eslint @eslint/js typescript-eslint



"@opentelemetry/instrumentation-http": "^0.52.1"

```


Decisions

While in local development mode, we want to enable SimpleProcessors to see logs immediately as they happen, and when deployed we want to use BatchProcessors for performance reasons





    "module": "Node18", //was commonjs
    "target": "es6",
    "outDir": "dist",
    "rootDir": ".",
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,


    
    "allowUnreachableCode": false,
    "noImplicitReturns": true,
    "noPropertyAccessFromIndexSignature":true








        "outDir": "dist",


    "target": "ES2022", //node20cfg --same
    "module": "NodeNext",  //node20cfg --same
    "moduleResolution": "nodenext", //node20cfg  = node16 not nodeNext --same
    "verbatimModuleSyntax": true, //node-tsCfg --same
    "strict": true, //node20cfg --same
    "esModuleInterop": true, //node20cfg --same

    +skipLibCheck:true ///node20cfg (false) --same(false)
    +lib: [es2023] //node20cfg --same
   +  "rewriteRelativeImportExtensions": true, //node-tsCfg --same
  +  "erasableSyntaxOnly": true, //node-tsCfg --same
   
