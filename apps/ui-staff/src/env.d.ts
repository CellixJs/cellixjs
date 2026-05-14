interface ImportMetaEnv {
	VITE_APP_UI_STAFF_AAD_AUTHORITY?: string;
	VITE_APP_UI_STAFF_AAD_CLIENTID?: string;
	VITE_APP_UI_STAFF_AAD_REDIRECT_URI?: string;
	VITE_APP_UI_STAFF_AAD_SCOPES?: string;
	VITE_COMMON_API_ENDPOINT?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
