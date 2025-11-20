import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { EndUserEntityReference } from '../../../contexts/user/end-user.ts';
import type { StaffRoleEntityReference } from '../../../contexts/user/staff-role/staff-role.ts';
import type { StaffUserEntityReference } from '../../../contexts/user/staff-user.ts';
import type { UserDomainPermissions } from '../../../contexts/user/user.domain-permissions.ts';
import type { UserVisa } from '../../../contexts/user/user.visa.ts';
import type { VendorUserEntityReference } from '../../../contexts/user/vendor-user/vendor-user.ts';
import { SystemUserPassport } from './system.user.passport.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/system.user.passport.feature'),
);

test.for(feature, ({ Scenario, Background }) => {
	let passport: SystemUserPassport;
	let permissions: Partial<UserDomainPermissions>;
	let endUserRef: EndUserEntityReference;
	let staffUserRef: StaffUserEntityReference;
	let staffRoleRef: StaffRoleEntityReference;
	let vendorUserRef: VendorUserEntityReference;
	let visa: UserVisa;
	let permissionResult: boolean;

	Background(({ Given }) => {
		Given('I have user domain permissions with canManageEndUsers true', () => {
			permissions = {
				canManageEndUsers: true,
			};
		});
	});

	Scenario(
		'Creating SystemUserPassport and getting visa for end user',
		({ Given, When, Then, And }) => {
			Given('I create a SystemUserPassport with permissions', () => {
				passport = new SystemUserPassport(permissions);
			});

			And('I have an end user entity reference', () => {
				endUserRef = { id: 'end-user-123' } as EndUserEntityReference;
			});

			When('I call forEndUser with the end user reference', () => {
				visa = passport.forEndUser(endUserRef);
			});

			Then('it should return a UserVisa', () => {
				expect(visa).toBeDefined();
				expect(typeof visa.determineIf).toBe('function');
			});

			And('the visa should allow determining permissions', () => {
				expect(typeof visa.determineIf).toBe('function');
				const result = visa.determineIf(
					(perms: Readonly<UserDomainPermissions>) => perms.canManageEndUsers,
				);
				expect(typeof result).toBe('boolean');
			});
		},
	);

	Scenario(
		'Creating SystemUserPassport and getting visa for staff user',
		({ Given, When, Then, And }) => {
			Given('I create a SystemUserPassport with permissions', () => {
				passport = new SystemUserPassport(permissions);
			});

			And('I have a staff user entity reference', () => {
				staffUserRef = { id: 'staff-user-123' } as StaffUserEntityReference;
			});

			When('I call forStaffUser with the staff user reference', () => {
				visa = passport.forStaffUser(staffUserRef);
			});

			Then('it should return a UserVisa', () => {
				expect(visa).toBeDefined();
				expect(typeof visa.determineIf).toBe('function');
			});

			And('the visa should allow determining permissions', () => {
				expect(typeof visa.determineIf).toBe('function');
				const result = visa.determineIf(
					(perms: Readonly<UserDomainPermissions>) => perms.canManageEndUsers,
				);
				expect(typeof result).toBe('boolean');
			});
		},
	);

	Scenario(
		'Creating SystemUserPassport and getting visa for staff role',
		({ Given, When, Then, And }) => {
			Given('I create a SystemUserPassport with permissions', () => {
				passport = new SystemUserPassport(permissions);
			});

			And('I have a staff role entity reference', () => {
				staffRoleRef = { id: 'staff-role-123' } as StaffRoleEntityReference;
			});

			When('I call forStaffRole with the staff role reference', () => {
				visa = passport.forStaffRole(staffRoleRef);
			});

			Then('it should return a UserVisa', () => {
				expect(visa).toBeDefined();
				expect(typeof visa.determineIf).toBe('function');
			});

			And('the visa should allow determining permissions', () => {
				expect(typeof visa.determineIf).toBe('function');
				const result = visa.determineIf(
					(perms: Readonly<UserDomainPermissions>) => perms.canManageEndUsers,
				);
				expect(typeof result).toBe('boolean');
			});
		},
	);

	Scenario(
		'Creating SystemUserPassport and getting visa for vendor user',
		({ Given, When, Then, And }) => {
			Given('I create a SystemUserPassport with permissions', () => {
				passport = new SystemUserPassport(permissions);
			});

			And('I have a vendor user entity reference', () => {
				vendorUserRef = { id: 'vendor-user-123' } as VendorUserEntityReference;
			});

			When('I call forVendorUser with the vendor user reference', () => {
				visa = passport.forVendorUser(vendorUserRef);
			});

			Then('it should return a UserVisa', () => {
				expect(visa).toBeDefined();
				expect(typeof visa.determineIf).toBe('function');
			});

			And('the visa should allow determining permissions', () => {
				expect(typeof visa.determineIf).toBe('function');
				const result = visa.determineIf(
					(perms: Readonly<UserDomainPermissions>) => perms.canManageEndUsers,
				);
				expect(typeof result).toBe('boolean');
			});
		},
	);

	Scenario(
		'Creating SystemUserPassport with no permissions',
		({ Given, When, Then, And }) => {
			Given('I create a SystemUserPassport with no permissions', () => {
				passport = new SystemUserPassport();
			});

			And('I have an end user entity reference', () => {
				endUserRef = { id: 'end-user-123' } as EndUserEntityReference;
			});

			When('I call forEndUser with the end user reference', () => {
				visa = passport.forEndUser(endUserRef);
			});

			Then(
				'it should return a UserVisa that works with empty permissions',
				() => {
					expect(visa).toBeDefined();
					expect(typeof visa.determineIf).toBe('function');
				},
			);
		},
	);

	Scenario(
		'Using visa to determine permissions',
		({ Given, When, Then, And }) => {
			Given(
				'I create a SystemUserPassport with canManageEndUsers permission',
				() => {
					passport = new SystemUserPassport({ canManageEndUsers: true });
				},
			);

			And('I have an end user entity reference', () => {
				endUserRef = { id: 'end-user-123' } as EndUserEntityReference;
			});

			When('I get a visa for the end user', () => {
				visa = passport.forEndUser(endUserRef);
			});

			And('I use determineIf to check if canManageEndUsers is true', () => {
				permissionResult = visa.determineIf(
					(perms: Readonly<UserDomainPermissions>) =>
						perms.canManageEndUsers === true,
				);
			});

			Then('it should return true', () => {
				expect(permissionResult).toBe(true);
			});
		},
	);
});
