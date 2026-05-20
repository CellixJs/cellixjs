/// <reference types="@ocom/ui-shared/env" />

declare global {
	interface ImportMetaEnv {
		readonly VITE_APP_UI_STAFF_AAD_REDIRECT_URI: string;
		readonly VITE_APP_UI_STAFF_AAD_CLIENTID: string;
		readonly VITE_APP_UI_STAFF_AAD_AUTHORITY: string;
		readonly VITE_APP_UI_STAFF_AAD_SCOPES: string;
	}

	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}
}

export {};
