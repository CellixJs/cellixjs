import { buildPortlessUrl } from '@cellix/local-dev';
import { getOcomHostnames } from './hostnames.ts';
import type { OcomLocalDevOptions, OcomUrls } from './types.ts';

export function buildOcomUrls(options: OcomLocalDevOptions = {}): OcomUrls {
	const hostnames = getOcomHostnames(options);

	return {
		uiCommunityBaseUrl: buildPortlessUrl(hostnames.uiCommunity),
		uiCommunityRedirectUrl: buildPortlessUrl(hostnames.uiCommunity, '/auth-redirect'),
		uiStaffBaseUrl: buildPortlessUrl(hostnames.uiStaff),
		uiStaffRedirectUrl: buildPortlessUrl(hostnames.uiStaff, '/auth-redirect'),
		apiGraphqlUrl: buildPortlessUrl(hostnames.api, '/api/graphql'),
		mockCommunityAuthorityUrl: buildPortlessUrl(hostnames.mockAuth, '/community'),
		mockCommunityJwksUrl: buildPortlessUrl(hostnames.mockAuth, '/community/.well-known/jwks.json'),
		mockStaffAuthorityUrl: buildPortlessUrl(hostnames.mockAuth, '/staff'),
		mockStaffJwksUrl: buildPortlessUrl(hostnames.mockAuth, '/staff/.well-known/jwks.json'),
		docsBaseUrl: buildPortlessUrl(hostnames.docs),
	};
}

export type { OcomLocalDevOptions, OcomUrls } from './types.ts';
