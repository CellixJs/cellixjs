interface ImportMetaEnv {
	VITE_AAD_B2C_STAFF_AUTHORITY?: string;
	VITE_AAD_B2C_STAFF_CLIENTID?: string;
	VITE_AAD_B2C_STAFF_REDIRECT_URI?: string;
	VITE_AAD_B2C_STAFF_SCOPES?: string;
	VITE_FUNCTION_ENDPOINT?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
