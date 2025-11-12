import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { EndUserEntityReference } from '../../../contexts/user/end-user/index.ts';
import type { StaffRoleEntityReference } from '../../../contexts/user/staff-role/staff-role.ts';
import type { StaffUserEntityReference } from '../../../contexts/user/staff-user/index.ts';
import type { UserVisa } from '../../../contexts/user/user.visa.ts';
import type { VendorUserEntityReference } from '../../../contexts/user/vendor-user/vendor-user.ts';
import { GuestUserPassport } from './guest.user.passport.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/guest.user.passport.feature'),
);

test.for(feature, ({ Scenario }) => {
	let passport: GuestUserPassport;
	let endUserRef: EndUserEntityReference;
	let staffUserRef: StaffUserEntityReference;
	let staffRoleRef: StaffRoleEntityReference;
	let vendorUserRef: VendorUserEntityReference;
	let visa: UserVisa;
	let permissionResult: boolean;

	Scenario(
		'Creating GuestUserPassport and getting visa for end user',
		({ When, Then, And }) => {
			When('I create a GuestUserPassport', () => {
				passport = new GuestUserPassport();
			});

			And('I have an end user entity reference', () => {
				endUserRef = { id: 'end-user-123' } as EndUserEntityReference;
			});

			And('I call forEndUser with the user reference', () => {
				visa = passport.forEndUser(endUserRef);
			});

			Then('it should return a UserVisa', () => {
				expect(visa).toBeDefined();
				expect(typeof visa.determineIf).toBe('function');
			});

			And('the visa should deny all permissions', () => {
				expect(visa.determineIf(() => true)).toBe(false);
			});
		},
	);

	Scenario(
		'Creating GuestUserPassport and getting visa for staff user',
		({ When, Then, And }) => {
			When('I create a GuestUserPassport', () => {
				passport = new GuestUserPassport();
			});

			And('I have a staff user entity reference', () => {
				staffUserRef = { id: 'staff-user-123' } as StaffUserEntityReference;
			});

			And('I call forStaffUser with the user reference', () => {
				visa = passport.forStaffUser(staffUserRef);
			});

			Then('it should return a UserVisa', () => {
				expect(visa).toBeDefined();
				expect(typeof visa.determineIf).toBe('function');
			});

			And('the visa should deny all permissions', () => {
				expect(visa.determineIf(() => true)).toBe(false);
			});
		},
	);

	Scenario(
		'Creating GuestUserPassport and getting visa for staff role',
		({ When, Then, And }) => {
			When('I create a GuestUserPassport', () => {
				passport = new GuestUserPassport();
			});

			And('I have a staff role entity reference', () => {
				staffRoleRef = { id: 'staff-role-123' } as StaffRoleEntityReference;
			});

			And('I call forStaffRole with the role reference', () => {
				visa = passport.forStaffRole(staffRoleRef);
			});

			Then('it should return a UserVisa', () => {
				expect(visa).toBeDefined();
				expect(typeof visa.determineIf).toBe('function');
			});

			And('the visa should deny all permissions', () => {
				expect(visa.determineIf(() => true)).toBe(false);
			});
		},
	);

	Scenario(
		'Creating GuestUserPassport and getting visa for vendor user',
		({ When, Then, And }) => {
			When('I create a GuestUserPassport', () => {
				passport = new GuestUserPassport();
			});

			And('I have a vendor user entity reference', () => {
				vendorUserRef = { id: 'vendor-user-123' } as VendorUserEntityReference;
			});

			And('I call forVendorUser with the user reference', () => {
				visa = passport.forVendorUser(vendorUserRef);
			});

			Then('it should return a UserVisa', () => {
				expect(visa).toBeDefined();
				expect(typeof visa.determineIf).toBe('function');
			});

			And('the visa should deny all permissions', () => {
				expect(visa.determineIf(() => true)).toBe(false);
			});
		},
	);

	Scenario('Using visa to determine permissions', ({ When, Then, And }) => {
		When('I create a GuestUserPassport', () => {
			passport = new GuestUserPassport();
		});

		And('I have an end user entity reference', () => {
			endUserRef = { id: 'end-user-123' } as EndUserEntityReference;
		});

		And('I get a visa for the user', () => {
			visa = passport.forEndUser(endUserRef);
		});

		And('I use determineIf to check any permission', () => {
			permissionResult = visa.determineIf(() => true);
		});

		Then('it should return false', () => {
			expect(permissionResult).toBe(false);
		});
	});
});
