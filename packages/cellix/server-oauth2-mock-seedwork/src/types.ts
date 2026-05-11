import type { Server } from 'node:http';

export interface MockOAuth2UserProfile {
	sub?: string;
	email?: string;
	given_name?: string;
	family_name?: string;
	tid?: string;
	[claim: string]: unknown;
}

export interface MockOAuth2User {
	/** Local username (login handle) */
	username: string;
	/** Stable subject identifier used for token issuance */
	sub: string;
	/** Plaintext password for the mock server only (never emitted) */
	password?: string;
	/** Arbitrary claims associated with this user (email, given_name, etc) */
	claims?: Record<string, unknown>;
}

/**
 * Async user lookup and persistence contract used by the interactive login, signup,
 * token, and userinfo flows.
 *
 * Implementations may read from files, databases, or in-memory fixtures, but callers
 * should always `await` these methods on the request path.
 *
 * @example
 * ```ts
 * const store: MockOAuth2UserStore = {
 *   async listUsers() {
 *     return [];
 *   },
 *   async findByUsername(username) {
 *     return username === 'alice' ? { username, sub: 'sub-alice', password: 'pw' } : undefined;
 *   },
 *   async findBySub(sub) {
 *     return sub === 'sub-alice' ? { username: 'alice', sub, password: 'pw' } : undefined;
 *   },
 *   async addUser(user) {
 *     void user;
 *   },
 * };
 * ```
 */
export interface MockOAuth2UserStore {
	/**
	 * Lists every available mock user visible to the current portal.
	 *
	 * @returns A promise that resolves to the current user set.
	 */
	listUsers(): Promise<MockOAuth2User[]>;
	/**
	 * Finds a mock user by login handle for the `/login` form flow.
	 *
	 * @param username - Local username submitted by the browser form.
	 * @returns A promise that resolves to the matching user, or `undefined` when no user exists.
	 */
	findByUsername(username: string): Promise<MockOAuth2User | undefined>;
	/**
	 * Finds a mock user by subject identifier for `/token` and `/userinfo` resolution.
	 *
	 * @param sub - Stable OIDC subject identifier.
	 * @returns A promise that resolves to the matching user, or `undefined` when no user exists.
	 */
	findBySub(sub: string): Promise<MockOAuth2User | undefined>;
	/**
	 * Persists a newly registered mock user from the `/signup` flow.
	 *
	 * @param user - The newly created mock user to store.
	 * @returns A promise that resolves after the user has been persisted.
	 */
	addUser(user: MockOAuth2User): Promise<void>;
	/**
	 * Optional flush hook for stores that need an explicit persistence step.
	 *
	 * @returns A promise that resolves when pending writes have been committed.
	 */
	persist?: () => Promise<void>;
}

export interface MockOAuth2PortalConfig {
	allowedRedirectUris: Set<string>;
	allowedRedirectUri: string;
	redirectUriToAudience: Map<string, string>;
	getUserProfile: () => MockOAuth2UserProfile;
	/** Optional provider for multi-user scenarios; when present, seedwork will use it for login/userinfo/token resolution */
	userStore?: MockOAuth2UserStore;
}

export interface MockOAuth2ServerConfig {
	port: number;
	baseUrl: string;
	host?: string;
	allowedRedirectUris: Set<string>;
	allowedRedirectUri: string;
	redirectUriToAudience: Map<string, string>;
	getUserProfile: () => MockOAuth2UserProfile;
	userStore?: MockOAuth2UserStore;
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
