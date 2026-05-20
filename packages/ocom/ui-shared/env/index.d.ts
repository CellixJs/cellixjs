/// <reference types="vite/client" />

declare global {
	interface ImportMetaEnv {
		readonly VITE_COMMON_API_ENDPOINT: string;
	}

	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}
}

export {};
