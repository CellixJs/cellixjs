import type { Server } from 'node:http';

export interface MockOAuth2UserProfile {
	sub?: string;
	email?: string;
	given_name?: string;
	family_name?: string;
	tid?: string;
	[claim: string]: unknown;
}

export interface MockOAuth2PortalConfig {
	allowedRedirectUris: Set<string>;
	allowedRedirectUri: string;
	redirectUriToAudience: Map<string, string>;
	getUserProfile: () => MockOAuth2UserProfile;
}

export interface MockOAuth2ServerConfig {
	port: number;
	baseUrl: string;
	host?: string;
	allowedRedirectUris: Set<string>;
	allowedRedirectUri: string;
	redirectUriToAudience: Map<string, string>;
	getUserProfile: () => MockOAuth2UserProfile;
}

export interface MockOAuth2ServerHandle {
	server: Server;
	disposer: {
		stop: () => Promise<void>;
	};
}

// Return value for a successful registration of a named OIDC mock portal
export interface MockOAuth2Registration extends MockOAuth2ServerHandle {
	/** Fully normalized base URL for the registered portal (e.g. https://mock:1234/{name}) */
	baseUrl: string;
	/** The registered portal name */
	name: string;
}

export interface MockOAuth2Manager {
	register(name: string, config: MockOAuth2PortalConfig): Promise<MockOAuth2Registration>;
	stopAll(): Promise<void>;
}
