import type { Domain } from '@ocom/domain';

/**
 * Admin-side property reads must be authorized by the request passport's
 * property visa (spec: application service operations enforce
 * `canManageProperties`). The passport is built from the request's current
 * member/community hints, so a manager of another community — or the same
 * user acting under a different community context — is denied here even if
 * they hold manage permissions elsewhere.
 */
export const ensurePropertyViewable = (passport: Domain.Passport, property: Domain.Contexts.Property.Property.PropertyEntityReference): void => {
	const canView = passport.property.forProperty(property).determineIf((permissions) => permissions.isSystemAccount || permissions.canManageProperties);
	if (!canView) {
		throw new Error('Unauthorized');
	}
};
