import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { EndUserEntityReference } from '../../../../contexts/user/end-user/index.ts';
import type { StaffRoleEntityReference } from '../../../../contexts/user/staff-role/staff-role.ts';
import type { StaffUserEntityReference } from '../../../../contexts/user/staff-user/staff-user.ts';
import type { VendorUserEntityReference } from '../../../../contexts/user/vendor-user/vendor-user.ts';
import { StaffUserUserPassport } from './staff-user.user.passport.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/staff-user.user.passport.feature'));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeStaffUser(externalId = 'ext-1', canManageStaffRolesAndPermissions = true): StaffUserEntityReference {
	return {
		id: 'staff-1',
		externalId,
		role: {
			permissions: {
				communityPermissions: {
					canManageStaffRolesAndPermissions,
				},
			},
		},
	} as unknown as StaffUserEntityReference;
}

function makeStaffUserNoRole(externalId = 'ext-no-role'): StaffUserEntityReference {
	return { id: 'staff-no-role', externalId } as unknown as StaffUserEntityReference;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let staffUser: StaffUserEntityReference;
	let passport: StaffUserUserPassport;

	BeforeEachScenario(() => {
		staffUser = makeStaffUser();
		passport = undefined as unknown as StaffUserUserPassport;
	});

	Background(({ Given }) => {
		Given('a valid StaffUserEntityReference with externalId "ext-1" and canManageStaffRolesAndPermissions true', () => {
			staffUser = makeStaffUser('ext-1', true);
		});
	});

	// ─── Constructor ──────────────────────────────────────────────────────────

	Scenario('Creating a StaffUserUserPassport with a staff user', ({ When, Then }) => {
		When('I create a StaffUserUserPassport with the staff user', () => {
			passport = new StaffUserUserPassport(staffUser);
		});
		Then('the passport should be created successfully', () => {
			expect(passport).toBeInstanceOf(StaffUserUserPassport);
		});
	});

	// ─── forEndUser ───────────────────────────────────────────────────────────

	Scenario('forEndUser returns a visa where canManageStaffRolesAndPermissions is true', ({ Given, When, Then, And }) => {
		let visa: ReturnType<StaffUserUserPassport['forEndUser']>;
		Given('a StaffUserUserPassport for the staff user', () => {
			passport = new StaffUserUserPassport(staffUser);
		});
		When('I call forEndUser with any EndUserEntityReference', () => {
			visa = passport.forEndUser({} as EndUserEntityReference);
		});
		Then('determineIf should return true for canManageStaffRolesAndPermissions', () => {
			expect(visa.determineIf((p) => p.canManageStaffRolesAndPermissions)).toBe(true);
		});
		And('determineIf should return false for canManageEndUsers', () => {
			expect(visa.determineIf((p) => p.canManageEndUsers)).toBe(false);
		});
		And('determineIf should return false for canManageVendorUsers', () => {
			expect(visa.determineIf((p) => p.canManageVendorUsers)).toBe(false);
		});
		And('determineIf should return false for isSystemAccount', () => {
			expect(visa.determineIf((p) => p.isSystemAccount)).toBe(false);
		});
		And('determineIf should return false for isEditingOwnAccount', () => {
			expect(visa.determineIf((p) => p.isEditingOwnAccount)).toBe(false);
		});
	});

	Scenario('forEndUser when the staff user has no role returns a visa with all permissions false', ({ Given, And, When, Then }) => {
		let visa: ReturnType<StaffUserUserPassport['forEndUser']>;
		Given('a StaffUserEntityReference with no role', () => {
			staffUser = makeStaffUserNoRole();
		});
		And('a StaffUserUserPassport for that staff user', () => {
			passport = new StaffUserUserPassport(staffUser);
		});
		When('I call forEndUser with any EndUserEntityReference', () => {
			visa = passport.forEndUser({} as EndUserEntityReference);
		});
		Then('determineIf should return false for canManageStaffRolesAndPermissions', () => {
			expect(visa.determineIf((p) => p.canManageStaffRolesAndPermissions)).toBe(false);
		});
	});

	// ─── forStaffUser ─────────────────────────────────────────────────────────

	Scenario('forStaffUser called with own staff user sets isEditingOwnAccount true', ({ Given, When, Then, And }) => {
		let visa: ReturnType<StaffUserUserPassport['forStaffUser']>;
		Given('a StaffUserUserPassport for the staff user', () => {
			passport = new StaffUserUserPassport(staffUser);
		});
		When('I call forStaffUser with the same staff user as the root', () => {
			visa = passport.forStaffUser(staffUser);
		});
		Then('determineIf should return true for isEditingOwnAccount', () => {
			expect(visa.determineIf((p) => p.isEditingOwnAccount)).toBe(true);
		});
		And('determineIf should return true for canManageStaffRolesAndPermissions', () => {
			expect(visa.determineIf((p) => p.canManageStaffRolesAndPermissions)).toBe(true);
		});
	});

	Scenario('forStaffUser called with a different staff user sets isEditingOwnAccount false', ({ Given, When, Then, And }) => {
		let visa: ReturnType<StaffUserUserPassport['forStaffUser']>;
		Given('a StaffUserUserPassport for the staff user', () => {
			passport = new StaffUserUserPassport(staffUser);
		});
		When('I call forStaffUser with a different StaffUserEntityReference', () => {
			const otherUser = makeStaffUser('ext-other', true);
			visa = passport.forStaffUser(otherUser);
		});
		Then('determineIf should return false for isEditingOwnAccount', () => {
			expect(visa.determineIf((p) => p.isEditingOwnAccount)).toBe(false);
		});
		And('determineIf should return true for canManageStaffRolesAndPermissions', () => {
			expect(visa.determineIf((p) => p.canManageStaffRolesAndPermissions)).toBe(true);
		});
	});

	// ─── forStaffRole ─────────────────────────────────────────────────────────

	Scenario('forStaffRole returns a visa where canManageStaffRolesAndPermissions is true', ({ Given, When, Then, And }) => {
		let visa: ReturnType<StaffUserUserPassport['forStaffRole']>;
		Given('a StaffUserUserPassport for the staff user', () => {
			passport = new StaffUserUserPassport(staffUser);
		});
		When('I call forStaffRole with any StaffRoleEntityReference', () => {
			visa = passport.forStaffRole({} as StaffRoleEntityReference);
		});
		Then('determineIf should return true for canManageStaffRolesAndPermissions', () => {
			expect(visa.determineIf((p) => p.canManageStaffRolesAndPermissions)).toBe(true);
		});
		And('determineIf should return false for isEditingOwnAccount', () => {
			expect(visa.determineIf((p) => p.isEditingOwnAccount)).toBe(false);
		});
	});

	// ─── forVendorUser ────────────────────────────────────────────────────────

	Scenario('forVendorUser returns a visa where canManageStaffRolesAndPermissions is true', ({ Given, When, Then, And }) => {
		let visa: ReturnType<StaffUserUserPassport['forVendorUser']>;
		Given('a StaffUserUserPassport for the staff user', () => {
			passport = new StaffUserUserPassport(staffUser);
		});
		When('I call forVendorUser with any VendorUserEntityReference', () => {
			visa = passport.forVendorUser({} as VendorUserEntityReference);
		});
		Then('determineIf should return true for canManageStaffRolesAndPermissions', () => {
			expect(visa.determineIf((p) => p.canManageStaffRolesAndPermissions)).toBe(true);
		});
		And('determineIf should return false for canManageVendorUsers', () => {
			expect(visa.determineIf((p) => p.canManageVendorUsers)).toBe(false);
		});
	});
});
