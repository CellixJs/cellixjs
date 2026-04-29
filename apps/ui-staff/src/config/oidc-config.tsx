type OIDCConfig = {
	authority: string;
	client_id: string;
	redirect_uri: string;
	code_verifier: boolean;
	noonce: boolean;
	response_type: string;
	scope: string;
	onSigninCallback: () => void;
};

export const oidcConfig: OIDCConfig = {
	authority:
		// biome-ignore lint:useLiteralKeys
		import.meta.env['VITE_AAD_B2C_STAFF_AUTHORITY'] ?? 'https://mock-auth.ownercommunity.localhost:1355/staff',
	// biome-ignore lint:useLiteralKeys
	client_id: import.meta.env['VITE_AAD_B2C_STAFF_CLIENTID'] ?? 'mock-client',

	redirect_uri:
		// biome-ignore lint:useLiteralKeys
		import.meta.env['VITE_AAD_B2C_STAFF_REDIRECT_URI'] ?? 'https://staff.ownercommunity.localhost:1355/auth-redirect',
	code_verifier: true,
	noonce: true,
	response_type: 'code',
	// biome-ignore lint:useLiteralKeys
	scope: import.meta.env['VITE_AAD_B2C_STAFF_SCOPES'],
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
