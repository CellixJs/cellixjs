import type { AzureFunctionsLocalSettingsOptions } from '@cellix/local-dev';
import type { OcomLocalDevOptions } from '../types.ts';
import { buildOcomUrls } from '../urls/index.ts';

/**
 * Builds the OCOM api's Azure Functions local-settings policy.
 *
 * This is the single source of truth for the api's `local.settings.json`
 * preparation, consumed by both the dev runner (`start-dev.ts`) and the
 * standalone sync (`sync-local-settings.ts`). It maps the mock OIDC issuer and
 * JWKS URLs into the E2E settings and names the keys that should receive a
 * worktree-scoped Azurite connection string.
 *
 * @param options - Optional environment and workspace-root overrides forwarded
 * to `buildOcomUrls`.
 * @returns Local-settings options for `AzureFunctionsDevRunner` /
 * `AzureFunctionsLocalSettings`.
 */
export function buildOcomApiLocalSettings(options: OcomLocalDevOptions = {}): AzureFunctionsLocalSettingsOptions {
	const urls = buildOcomUrls(options);

	return {
		e2eValues: {
			ACCOUNT_PORTAL_OIDC_ISSUER: urls.mockCommunityAuthorityUrl,
			ACCOUNT_PORTAL_OIDC_ENDPOINT: urls.mockCommunityJwksUrl,
			STAFF_PORTAL_OIDC_ISSUER: urls.mockStaffAuthorityUrl,
			STAFF_PORTAL_OIDC_ENDPOINT: urls.mockStaffJwksUrl,
		},
		azuriteConnectionStringKeys: ['AZURE_STORAGE_CONNECTION_STRING', 'AzureWebJobsStorage'],
	};
}
