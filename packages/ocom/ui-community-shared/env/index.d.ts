/// <reference types="@ocom/ui-shared/env" />

declare global {
	interface ImportMetaEnv {
		readonly VITE_APP_UI_COMMUNITY_END_USER_B2C_REDIRECT_URI: string;
		readonly VITE_APP_UI_COMMUNITY_END_USER_B2C_CLIENTID: string;
		readonly VITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI: string;
		readonly VITE_APP_UI_COMMUNITY_B2C_CLIENTID: string;
		readonly VITE_APP_UI_COMMUNITY_B2C_AUTHORITY: string;
		readonly VITE_APP_UI_COMMUNITY_B2C_SCOPES: string;
		readonly VITE_APP_UI_COMMUNITY_BASE_URL: string;
	}

	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}
}

export {};
