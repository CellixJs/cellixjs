type OIDCConfig = {
	authority: string;
	client_id: string;
	redirect_uri: string;
	code_verifier: boolean;
	nonce: boolean;
	response_type: string;
	scope: string;
	onSigninCallback: () => void;
};

export const oidcConfig: OIDCConfig = {
	authority:
		// biome-ignore lint:useLiteralKeys
		import.meta.env['VITE_AAD_B2C_ACCOUNT_AUTHORITY'] ?? 'https://mock-auth.ownercommunity.localhost',
	// biome-ignore lint:useLiteralKeys
	client_id: import.meta.env['VITE_AAD_B2C_ACCOUNT_CLIENTID'] ?? 'mock-client',

	redirect_uri:
		// biome-ignore lint:useLiteralKeys
		import.meta.env['VITE_AAD_B2C_REDIRECT_URI'] ?? 'https://ownercommunity.localhost/auth-redirect',
	code_verifier: true,
	nonce: true,
	response_type: 'code',
	// biome-ignore lint:useLiteralKeys
	scope: import.meta.env['VITE_AAD_B2C_ACCOUNT_SCOPES'] ?? 'openid', 
	onSigninCallback: (): void => {
		console.log('onSigninCallback');
		globalThis.history.replaceState({}, document.title, globalThis.location.pathname);
		const redirectToPath = globalThis.sessionStorage.getItem('redirectTo');
		if (redirectToPath) {
			globalThis.location.pathname = redirectToPath;
			globalThis.sessionStorage.removeItem('redirectTo');
		}
	},
};
