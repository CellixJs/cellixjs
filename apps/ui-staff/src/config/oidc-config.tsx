export const oidcConfig = {
	// minimal placeholder config for local development
	authority: import.meta.env.VITE_AAD_B2C_ACCOUNT_AUTHORITY ?? 'https://mock-auth.staff.localhost',
	client_id: import.meta.env.VITE_AAD_B2C_ACCOUNT_CLIENTID ?? 'mock-client',
	redirect_uri: import.meta.env.VITE_AAD_B2C_REDIRECT_URI ?? 'https://staff.localhost/auth-redirect',
	code_verifier: true,
	noonce: true,
	response_type: 'code',
	scope: import.meta.env.VITE_AAD_B2C_ACCOUNT_SCOPES,
	onSigninCallback: (): void => {
		globalThis.history.replaceState({}, document.title, globalThis.location.pathname);
		const redirectToPath = globalThis.sessionStorage.getItem('redirectTo');
		if (redirectToPath) {
			globalThis.location.pathname = redirectToPath;
			globalThis.sessionStorage.removeItem('redirectTo');
		}
	},
};
