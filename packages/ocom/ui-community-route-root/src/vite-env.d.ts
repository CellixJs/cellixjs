/// <reference types="vite/client" />

interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}