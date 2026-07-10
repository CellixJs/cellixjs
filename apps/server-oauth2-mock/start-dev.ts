/// <reference types="node" />
import { NodeDevRunner } from '@cellix/local-dev';
import { buildOcomUrls } from '@ocom/local-dev-config';

const urls = buildOcomUrls();
const mockAuthBaseUrl = new URL(urls.mockCommunityAuthorityUrl).origin;

new NodeDevRunner({
	settings: {
		BASE_URL: mockAuthBaseUrl,
		VITE_APP_UI_COMMUNITY_END_USER_B2C_REDIRECT_URI: urls.uiCommunityRedirectUrl,
		VITE_APP_UI_STAFF_STAFF_USER_AAD_REDIRECT_URI: urls.uiStaffRedirectUrl,
	},
}).start();
