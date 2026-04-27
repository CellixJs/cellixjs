/*
	Index entrypoint — re-exports from smaller modules to keep the public surface stable
*/
export { createMockOAuth2Manager } from './manager.ts';
export { buildOidcRouter } from './router.ts';
export { startMockOAuth2Server } from './server.ts';

export type { MockOAuth2Manager, MockOAuth2PortalConfig, MockOAuth2Registration, MockOAuth2ServerConfig, MockOAuth2ServerHandle, MockOAuth2UserProfile } from './types.ts';
export { normalizeBaseUrl, normalizeOrigin, normalizeUrl, SAFE_NAME_RE } from './utils.ts';
