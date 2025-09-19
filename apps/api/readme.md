nvm use v20





npm install -D @types/node -w api

npm install -D eslint @eslint/js typescript-eslint -w @ocom/api

npm install @azure/identity -w api

npm install @as-integrations/azure-functions -api

needed "skipLibCheck": true in tsconfig.json to build mongoose



Following Standards:

TypeScript Style: 
[Google's Style Guide](https://github.com/google/styleguide?tab=readme-ov-file#google-style-guides)



host.json settings

* telemetryMode: OpenTelemetry
  * this project is set up for OpenTelemetry