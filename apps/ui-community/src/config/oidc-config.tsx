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
	authority: import.meta.env.VITE_APP_UI_COMMUNITY_END_USER_B2C_AUTHORITY ?? 'https://mock-auth.ownercommunity.localhost:1355/community-end-user',
	client_id: import.meta.env.VITE_APP_UI_COMMUNITY_END_USER_B2C_CLIENTID ?? 'mock-client',
	redirect_uri: import.meta.env.VITE_APP_UI_COMMUNITY_END_USER_B2C_REDIRECT_URI ?? 'https://ownercommunity.localhost:1355/auth-redirect',
	code_verifier: true,
	nonce: true,
	response_type: 'code',
	scope: import.meta.env.VITE_APP_UI_COMMUNITY_END_USER_B2C_SCOPES ?? 'openid',
	onSigninCallback: (): void => {
		globalThis.history.replaceState({}, document.title, globalThis.location.pathname);
		const redirectToPath = globalThis.sessionStorage.getItem('redirectTo');
		if (redirectToPath) {
			globalThis.location.pathname = redirectToPath;
			globalThis.sessionStorage.removeItem('redirectTo');
		}
	},
};
