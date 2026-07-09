/**
 * Options shared by OCOM local-development config helpers.
 */
export interface OcomLocalDevOptions {
	/** Environment override source. Defaults to `process.env`. */
	env?: NodeJS.ProcessEnv;
	/** Workspace root to read app `.env` files from. Defaults to auto-discovery. */
	workspaceRoot?: string;
}

/**
 * Portless hostnames used by OCOM browser-facing apps and local HTTP mocks.
 */
export interface OcomHostnames {
	/** Community portal hostname. */
	uiCommunity: string;
	/** Staff portal hostname. */
	uiStaff: string;
	/** API hostname. */
	api: string;
	/** Mock authentication server hostname. */
	mockAuth: string;
	/** Documentation site hostname. */
	docs: string;
}

/**
 * Fully qualified local URLs consumed by OCOM app wrappers.
 */
export interface OcomUrls {
	/** Community portal base URL. */
	uiCommunityBaseUrl: string;
	/** Community portal OIDC redirect URL. */
	uiCommunityRedirectUrl: string;
	/** Staff portal base URL. */
	uiStaffBaseUrl: string;
	/** Staff portal OIDC redirect URL. */
	uiStaffRedirectUrl: string;
	/** API GraphQL endpoint URL. */
	apiGraphqlUrl: string;
	/** Community OIDC issuer URL on the mock auth server. */
	mockCommunityAuthorityUrl: string;
	/** Community OIDC JWKS URL on the mock auth server. */
	mockCommunityJwksUrl: string;
	/** Staff OIDC issuer URL on the mock auth server. */
	mockStaffAuthorityUrl: string;
	/** Staff OIDC JWKS URL on the mock auth server. */
	mockStaffJwksUrl: string;
	/** Documentation site base URL. */
	docsBaseUrl: string;
}
