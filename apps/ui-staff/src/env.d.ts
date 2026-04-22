interface ImportMetaEnv {
	VITE_AAD_B2C_ACCOUNT_AUTHORITY?: string;
	VITE_AAD_B2C_ACCOUNT_CLIENTID?: string;
	VITE_AAD_B2C_REDIRECT_URI?: string;
	VITE_AAD_B2C_ACCOUNT_SCOPES?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
