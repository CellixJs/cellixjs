import type { Domain } from '@ocom/domain';

type PropertyAuthorizationSubject = Domain.Contexts.Property.PropertyAuthorizationSubject;

const forCommunity = (communityId: string): PropertyAuthorizationSubject => ({
	community: { id: communityId },
});

/**
 * Non-throwing variant of {@link ensurePropertyViewable} for read paths that
 * deny by omission instead of by error.
 */
export const isPropertyViewable = (passport: Domain.Passport, property: PropertyAuthorizationSubject): boolean => {
	return passport.property.forProperty(property).determineIf((permissions) => permissions.isSystemAccount || permissions.canManageProperties || permissions.canEditOwnProperty);
};

/**
 * Property reads are authorized by the request passport's property visa. An
 * accepted own-property member can read every property in their selected
 * community, while a manager or system account retains the same access.
 */
export const ensurePropertyViewable = (passport: Domain.Passport, property: PropertyAuthorizationSubject): void => {
	if (!isPropertyViewable(passport, property)) {
		throw new Error('Unauthorized');
	}
};

/**
 * Authorizes a community-wide property read before any rows are fetched, so an
 * unauthorized actor is rejected even when the community has no properties.
 * Property visas scope by the root's community (and this read predicate never
 * needs an owner), so a minimal community-scoped subject is sufficient.
 */
export const ensureCommunityPropertiesViewable = (passport: Domain.Passport, communityId: string): void => {
	ensurePropertyViewable(passport, forCommunity(communityId));
};

export const isCommunityPropertiesManageable = (passport: Domain.Passport, communityId: string): boolean => {
	return passport.property.forProperty(forCommunity(communityId)).determineIf((permissions) => permissions.isSystemAccount || permissions.canManageProperties);
};

/**
 * Management-only collection operations (owner selection and manager-created
 * ownership assignment) must not inherit the broader listing-read policy.
 */
export const ensureCommunityPropertiesManageable = (passport: Domain.Passport, communityId: string): void => {
	if (!isCommunityPropertiesManageable(passport, communityId)) {
		throw new Error('Unauthorized');
	}
};

/**
 * A property may be created by a manager/system account or by an accepted
 * member with the narrowly scoped own-property capability. The latter must
 * still be paired with a trusted current-member context by create.ts.
 */
export const ensureCommunityPropertiesCreatable = (passport: Domain.Passport, communityId: string): void => {
	if (!passport.property.forProperty(forCommunity(communityId)).determineIf((permissions) => permissions.isSystemAccount || permissions.canManageProperties || permissions.canEditOwnProperty)) {
		throw new Error('Unauthorized');
	}
};
