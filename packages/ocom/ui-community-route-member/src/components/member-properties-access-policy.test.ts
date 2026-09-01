import { describe, expect, it } from 'vitest';
import { type MemberPropertiesRouteMembership, resolveMemberPropertiesAccess } from './member-properties-access-policy.ts';

const communityId = 'community-id';
const memberId = 'member-id';
const userId = 'user-id';

const membership = (overrides: Partial<MemberPropertiesRouteMembership> = {}): MemberPropertiesRouteMembership => ({
	id: memberId,
	community: { id: communityId },
	accounts: [{ statusCode: 'ACCEPTED', user: { id: userId } }],
	role: { permissions: { propertyPermissions: { canManageProperties: false, canEditOwnProperty: true } } },
	...overrides,
});

describe('resolveMemberPropertiesAccess', () => {
	it('allows an accepted same-community own-property member', () => {
		expect(resolveMemberPropertiesAccess([membership()], userId, communityId, memberId)).toBe('allowed');
	});

	it('redirects an accepted same-community property manager', () => {
		expect(resolveMemberPropertiesAccess([membership({ role: { permissions: { propertyPermissions: { canManageProperties: true, canEditOwnProperty: true } } } })], userId, communityId, memberId)).toBe('manager-redirect');
	});

	it.each([
		['missing own-property permission', membership({ role: { permissions: { propertyPermissions: { canManageProperties: false, canEditOwnProperty: false } } } }), communityId, memberId],
		['inactive account', membership({ accounts: [{ statusCode: 'CREATED', user: { id: userId } }] }), communityId, memberId],
		['mismatched route member', membership(), communityId, 'another-member'],
		['mismatched route community', membership(), 'another-community', memberId],
	])('denies %s', (_description, currentMembership, currentCommunityId, currentMemberId) => {
		expect(resolveMemberPropertiesAccess([currentMembership], userId, currentCommunityId, currentMemberId)).toBe('denied');
	});
});
