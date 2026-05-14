/*
	Index entrypoint — re-exports from smaller modules to keep the public surface stable
*/

export { debugLog } from './logger.ts';
export { createMockOAuth2Manager } from './manager.ts';
export { buildOidcRouter } from './router.ts';
export { startMockOAuth2Server } from './server.ts';

export type { MockOAuth2Manager, MockOAuth2PortalConfig, MockOAuth2Registration, MockOAuth2ServerConfig, MockOAuth2ServerHandle, MockOAuth2User, MockOAuth2UserProfile, MockOAuth2UserStore } from './types.ts';
export { AUTH_CODE_PREFIX, normalizeBaseUrl, normalizeOrigin, normalizeUrl, SAFE_NAME_RE } from './utils.ts';
