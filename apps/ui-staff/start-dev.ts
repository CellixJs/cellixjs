import { ViteDevRunner } from '@cellix/local-dev';
import { buildOcomUrls } from '@ocom/local-dev-config';

const urls = buildOcomUrls();

new ViteDevRunner({
	settings: {
		VITE_APP_UI_STAFF_AAD_AUTHORITY: urls.mockStaffAuthorityUrl,
		VITE_APP_UI_STAFF_AAD_REDIRECT_URI: urls.uiStaffRedirectUrl,
		VITE_APP_UI_STAFF_BASE_URL: urls.uiStaffBaseUrl,
		VITE_COMMON_API_ENDPOINT: urls.apiGraphqlUrl,
	},
}).start();
