/// <reference types="vite/client" />

interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly NODE_ENV: string
  readonly VITE_APP_UI_COMMUNITY_B2C_AUTHORITY: string
  readonly VITE_APP_UI_COMMUNITY_B2C_CLIENTID: string
  readonly VITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI: string
  readonly VITE_APP_UI_COMMUNITY_B2C_SCOPES: string
  readonly VITE_COMMON_API_ENDPOINT: string
  readonly VITE_APP_UI_COMMUNITY_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}