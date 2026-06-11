/// <reference types="node" />
import { NodeDevRunner } from '@cellix/local-dev';
import { buildOcomUrls } from '@ocom/local-dev-config';

const urls = buildOcomUrls();

new NodeDevRunner({
	settings: {
		BASE_URL: urls.mockCommunityAuthorityUrl.replace('/community', ''),
		VITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI: urls.uiCommunityRedirectUrl,
		VITE_APP_UI_STAFF_AAD_REDIRECT_URI: urls.uiStaffRedirectUrl,
	},
}).start();
