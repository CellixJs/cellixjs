declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';

    // Azure Functions / local settings
    AZURE_STORAGE_CONNECTION_STRING: string;

    // Account portal / OIDC
    ACCOUNT_PORTAL_OIDC_AUDIENCE: string;
    ACCOUNT_PORTAL_OIDC_ENDPOINT: string;
    ACCOUNT_PORTAL_OIDC_ISSUER: string;
    ACCOUNT_PORTAL_OIDC_IGNORE_ISSUER: string; // 'true' | 'false' stored as string in env

    // App Insights
    APPLICATIONINSIGHTS_CONNECTION_STRING: string;

    // Cosmos / Mongo connection
    COSMOSDB_CONNECTION_STRING: string;
    COSMOSDB_DBNAME: string;

    // Storage account (Azurite)
    STORAGE_ACCOUNT_NAME: string;
    STORAGE_ACCOUNT_KEY: string;
  }
}