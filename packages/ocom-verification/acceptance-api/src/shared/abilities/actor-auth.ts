/**
 * Per-actor authentication registry for the API acceptance suite.
 *
 * Step definitions register a test token per Serenity actor name; the GraphQL
 * client ability resolves the token lazily on every request, so a single cast
 * supports scenarios with differently privileged (or unauthenticated) actors.
 */

const tokensByActorName = new Map<string, string | null>();

/** Member/community context headers sent alongside an actor's auth token. */
interface ActorPrincipalContext {
	memberId: string;
	communityId: string;
}

const contextsByActorName = new Map<string, ActorPrincipalContext>();

/** Default token: resolves to the CommunityOwner AccountPortal principal in the mock token validation. */
const DEFAULT_TEST_AUTH_TOKEN = 'Bearer test-token';

/** Prefix for tokens that resolve to a staff principal in the mock token validation. */
export const STAFF_TOKEN_PREFIX = 'staff:';

/** Prefix for tokens that resolve to a named end-user AccountPortal principal in the mock token validation. */
export const USER_TOKEN_PREFIX = 'user:';

/** Build the token for a staff test actor (e.g. `staff:TechAdminStaff`). */
export function staffTokenFor(actorName: string): string {
	return `${STAFF_TOKEN_PREFIX}${actorName}`;
}

/** Build the token for an end-user test actor (e.g. `user:CommunityOwner`). */
export function userTokenFor(actorName: string): string {
	return `${USER_TOKEN_PREFIX}${actorName}`;
}

/** Register the auth token used by the given Serenity actor. Pass `null` for an unauthenticated actor. */
export function setActorToken(actorName: string, token: string | null): void {
	tokensByActorName.set(actorName, token);
}

/** Resolve the auth token for an actor; defaults to the CommunityOwner token when unregistered. */
export function getActorToken(actorName: string): string | null {
	return tokensByActorName.has(actorName) ? (tokensByActorName.get(actorName) ?? null) : DEFAULT_TEST_AUTH_TOKEN;
}

/** Register the member/community context headers used by the given Serenity actor. Pass `null` to clear. */
export function setActorContext(actorName: string, context: ActorPrincipalContext | null): void {
	if (context === null) {
		contextsByActorName.delete(actorName);
		return;
	}
	contextsByActorName.set(actorName, context);
}

/** Resolve the member/community context for an actor; `undefined` when the actor acts without member context. */
export function getActorContext(actorName: string): ActorPrincipalContext | undefined {
	return contextsByActorName.get(actorName);
}

/** Clear all registered actor tokens and member/community contexts (called between scenarios). */
export function clearActorTokens(): void {
	tokensByActorName.clear();
	contextsByActorName.clear();
}
