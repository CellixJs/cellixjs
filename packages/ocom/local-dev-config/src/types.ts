export interface OcomLocalDevOptions {
	env?: NodeJS.ProcessEnv;
	workspaceRoot?: string;
}

export interface OcomHostnames {
	uiCommunity: string;
	uiStaff: string;
	api: string;
	mockAuth: string;
	docs: string;
}

export interface OcomUrls {
	uiCommunityBaseUrl: string;
	uiCommunityRedirectUrl: string;
	uiStaffBaseUrl: string;
	uiStaffRedirectUrl: string;
	apiGraphqlUrl: string;
	mockCommunityAuthorityUrl: string;
	mockCommunityJwksUrl: string;
	mockStaffAuthorityUrl: string;
	mockStaffJwksUrl: string;
	docsBaseUrl: string;
}
