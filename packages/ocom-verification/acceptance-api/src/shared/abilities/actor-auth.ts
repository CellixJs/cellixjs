/**
 * Per-actor authentication registry for the API acceptance suite.
 *
 * Step definitions register a test token (and optional principal hints) per
 * Serenity actor name; the GraphQL client ability resolves them lazily on
 * every request, so a single cast supports scenarios with differently
 * privileged (or unauthenticated) actors.
 */

const tokensByActorName = new Map<string, string | null>();

/** Principal hints forwarded as `x-member-id` / `x-community-id` headers. */
interface ActorPrincipalHints {
	memberId?: string;
	communityId?: string;
}

const hintsByActorName = new Map<string, ActorPrincipalHints>();

/** Default token: resolves to the CommunityOwner AccountPortal principal in the mock token validation. */
const DEFAULT_TEST_AUTH_TOKEN = 'test-auth-token';

/** Prefix for tokens that resolve to a staff principal in the mock token validation. */
export const STAFF_TOKEN_PREFIX = 'staff:';

/** Prefix for tokens that resolve to a specific end-user AccountPortal principal in the mock token validation. */
export const END_USER_TOKEN_PREFIX = 'enduser:';

/** Build the token for a staff test actor (e.g. `staff:TechAdminStaff`). */
export function staffTokenFor(actorName: string): string {
	return `${STAFF_TOKEN_PREFIX}${actorName}`;
}

/** Build the token for an end-user test actor (e.g. `enduser:CommunityMember`). */
export function endUserTokenFor(actorName: string): string {
	return `${END_USER_TOKEN_PREFIX}${actorName}`;
}

/** Register the auth token used by the given Serenity actor. Pass `null` for an unauthenticated actor. */
export function setActorToken(actorName: string, token: string | null): void {
	tokensByActorName.set(actorName, token);
}

/** Resolve the auth token for an actor; defaults to the CommunityOwner token when unregistered. */
export function getActorToken(actorName: string): string | null {
	return tokensByActorName.has(actorName) ? (tokensByActorName.get(actorName) ?? null) : DEFAULT_TEST_AUTH_TOKEN;
}

/** Register the principal hints (member/community) sent by the given Serenity actor. */
export function setActorHints(actorName: string, hints: ActorPrincipalHints): void {
	hintsByActorName.set(actorName, hints);
}

/** Resolve the principal hints for an actor, if any were registered. */
export function getActorHints(actorName: string): ActorPrincipalHints | undefined {
	return hintsByActorName.get(actorName);
}

/** Clear all registered actor tokens and hints (called between scenarios). */
export function clearActorTokens(): void {
	tokensByActorName.clear();
	hintsByActorName.clear();
}
