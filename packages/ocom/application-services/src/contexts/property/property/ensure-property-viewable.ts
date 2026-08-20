import type { Domain } from '@ocom/domain';

/**
 * Non-throwing variant of {@link ensurePropertyViewable} for read paths that
 * deny by omission instead of by error.
 */
export const isPropertyViewable = (passport: Domain.Passport, property: Domain.Contexts.Property.Property.PropertyEntityReference): boolean => {
	return passport.property.forProperty(property).determineIf((permissions) => permissions.isSystemAccount || permissions.canManageProperties);
};

/**
 * Admin-side property reads must be authorized by the request passport's
 * property visa (spec: application service operations enforce
 * `canManageProperties`). The passport is built from the request's current
 * member/community hints, so a manager of another community — or the same
 * user acting under a different community context — is denied here even if
 * they hold manage permissions elsewhere.
 */
export const ensurePropertyViewable = (passport: Domain.Passport, property: Domain.Contexts.Property.Property.PropertyEntityReference): void => {
	if (!isPropertyViewable(passport, property)) {
		throw new Error('Unauthorized');
	}
};

/**
 * Authorizes a community-wide property read before any rows are fetched, so an
 * unauthorized actor is rejected even when the community has no properties.
 * Property visas scope by the root's community (and never dereference other
 * root fields for the manage/system predicates), so a minimal community-scoped
 * root is sufficient to evaluate the same predicate the per-property check uses.
 */
export const ensureCommunityPropertiesViewable = (passport: Domain.Passport, communityId: string): void => {
	const communityScopedRoot = { community: { id: communityId } } as Domain.Contexts.Property.Property.PropertyEntityReference;
	ensurePropertyViewable(passport, communityScopedRoot);
};
