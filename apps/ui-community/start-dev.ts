/// <reference types="node" />
import { runViteDev } from '@cellix/local-dev';
import { buildOcomUrls } from '@ocom/local-dev-config';

const urls = buildOcomUrls();

runViteDev({
	env: {
		...process.env,
		VITE_APP_UI_COMMUNITY_B2C_AUTHORITY: urls.mockCommunityAuthorityUrl,
		VITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI: urls.uiCommunityRedirectUrl,
		VITE_COMMON_API_ENDPOINT: urls.apiGraphqlUrl,
		VITE_APP_UI_COMMUNITY_BASE_URL: urls.uiCommunityBaseUrl,
	},
});
