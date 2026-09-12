import { describe, expect, it } from 'vitest';
import { canAccessAdminPortal, hasAcceptedAccountForUser } from './member-admin-access.ts';

const propertyManagerRole = {
	permissions: { isNonPropertyAdmin: false, propertyPermissions: { canManageProperties: true } },
};

const memberRole = {
	permissions: { isNonPropertyAdmin: false, propertyPermissions: { canManageProperties: false } },
};

const mixedAdminRole = {
	permissions: { isNonPropertyAdmin: true, propertyPermissions: { canManageProperties: true } },
};

const nonPropertyAdminRole = {
	permissions: { isNonPropertyAdmin: true, propertyPermissions: { canManageProperties: false } },
};

const acceptedAccount = (userId: string) => ({ statusCode: 'ACCEPTED', user: { id: userId } });
const pendingAccount = (userId: string) => ({ statusCode: 'PENDING', user: { id: userId } });

describe('hasAcceptedAccountForUser', () => {
	it('is true only for an ACCEPTED account belonging to the current end user', () => {
		expect(hasAcceptedAccountForUser([acceptedAccount('user-1')], 'user-1')).toBe(true);
		expect(hasAcceptedAccountForUser([acceptedAccount('user-2')], 'user-1')).toBe(false);
		expect(hasAcceptedAccountForUser([pendingAccount('user-1')], 'user-1')).toBe(false);
		expect(hasAcceptedAccountForUser([], 'user-1')).toBe(false);
		expect(hasAcceptedAccountForUser(null, 'user-1')).toBe(false);
		expect(hasAcceptedAccountForUser([acceptedAccount('user-1')], null)).toBe(false);
	});
});

describe('canAccessAdminPortal', () => {
	it('denies a missing member', () => {
		expect(canAccessAdminPortal(null, 'user-1')).toBe(false);
		expect(canAccessAdminPortal(undefined, 'user-1')).toBe(false);
	});

	it('allows a property manager with an ACCEPTED account for the current user', () => {
		const member = { isAdmin: true, role: propertyManagerRole, accounts: [acceptedAccount('user-1')] };
		expect(canAccessAdminPortal(member, 'user-1')).toBe(true);
	});

	it('denies a property manager whose account is not ACCEPTED even when isAdmin is set', () => {
		// The backend derives isAdmin from canManageProperties itself, so the
		// flag must not bypass the active-account requirement for managers.
		const member = { isAdmin: true, role: propertyManagerRole, accounts: [pendingAccount('user-1')] };
		expect(canAccessAdminPortal(member, 'user-1')).toBe(false);
	});

	it('denies a property manager whose ACCEPTED account belongs to a different user', () => {
		const member = { isAdmin: true, role: propertyManagerRole, accounts: [acceptedAccount('user-2')] };
		expect(canAccessAdminPortal(member, 'user-1')).toBe(false);
	});

	it('allows an admin through non-property permissions regardless of account status', () => {
		const member = { isAdmin: true, role: nonPropertyAdminRole, accounts: [pendingAccount('user-1')] };
		expect(canAccessAdminPortal(member, 'user-1')).toBe(true);
	});

	it('allows a mixed-permission admin who also manages properties without an ACCEPTED account', () => {
		// Admins holding non-property permissions must keep the legacy entry
		// points even though they also hold canManageProperties.
		const member = { isAdmin: true, role: mixedAdminRole, accounts: [pendingAccount('user-1')] };
		expect(canAccessAdminPortal(member, 'user-1')).toBe(true);
	});

	it('falls back to the isAdmin flag when role permissions are not available', () => {
		const member = { isAdmin: true, role: memberRole, accounts: [pendingAccount('user-1')] };
		expect(canAccessAdminPortal(member, 'user-1')).toBe(true);
	});

	it('denies a plain member with neither admin permissions nor property management', () => {
		const member = { isAdmin: false, role: memberRole, accounts: [acceptedAccount('user-1')] };
		expect(canAccessAdminPortal(member, 'user-1')).toBe(false);
	});
});
