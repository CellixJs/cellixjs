/// <reference types="vite/client" />

declare global {
	interface ImportMetaEnv {
		readonly NODE_ENV: string;
		readonly VITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI: string;
		readonly VITE_APP_UI_STAFF_AAD_AUTHORITY: string;
		readonly VITE_APP_UI_STAFF_AAD_CLIENTID: string;
		readonly VITE_APP_UI_STAFF_AAD_REDIRECT_URI: string;
		readonly VITE_APP_UI_STAFF_AAD_SCOPES: string;
		readonly VITE_COMMON_API_ENDPOINT: string;
	}
	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}
}

export {};
