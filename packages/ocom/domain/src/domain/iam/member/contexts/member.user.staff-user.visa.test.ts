import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { MemberEntityReference } from '../../../contexts/community/member/member.ts';
import type { StaffUserEntityReference } from '../../../contexts/user/staff-user/staff-user.ts';
import { MemberUserStaffUserVisa } from './member.user.staff-user.visa.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/member.user.staff-user.feature'),
);

function makeStaffUser(id = 'staff-1') {
	// biome-ignore lint/plugin/no-type-assertion: test file
	return { id } as StaffUserEntityReference;
}

function makeMember(id = 'member-1') {
	// biome-ignore lint/plugin/no-type-assertion: test file
	return { id } as MemberEntityReference;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let StaffUser: ReturnType<typeof makeStaffUser>;
	let member: ReturnType<typeof makeMember>;
	let visa: MemberUserStaffUserVisa<ReturnType<typeof makeStaffUser>>;

	BeforeEachScenario(() => {
		StaffUser = makeStaffUser();
		member = makeMember();
		// biome-ignore lint/plugin/no-type-assertion: test file
		visa = undefined as unknown as MemberUserStaffUserVisa<
			ReturnType<typeof makeStaffUser>
		>;
	});

	Background(({ Given, And }) => {
		Given('a valid StaffUserEntityReference with id "staff-1"', () => {
			StaffUser = makeStaffUser('staff-1');
		});
		And('a valid MemberEntityReference with id "member-1"', () => {
			member = makeMember('member-1');
		});
	});

	Scenario('Creating a MemberUserStaffUserVisa', ({ When, Then }) => {
		When(
			'I create a MemberUserStaffUserVisa with the staff user and member',
			() => {
				visa = new MemberUserStaffUserVisa(StaffUser, member);
			},
		);
		Then('the visa should be created successfully', () => {
			expect(visa).toBeInstanceOf(MemberUserStaffUserVisa);
		});
	});

	Scenario(
		'determineIf returns true when the predicate returns true',
		({ Given, When, Then }) => {
			let result: boolean;
			Given('a MemberUserStaffUserVisa for the staff user and member', () => {
				visa = new MemberUserStaffUserVisa(StaffUser, member);
			});
			When(
				'I call determineIf with a function that always returns true',
				() => {
					result = visa.determineIf(() => true);
				},
			);
			Then('the result should be true', () => {
				expect(result).toBe(true);
			});
		},
	);

	Scenario(
		'determineIf returns false when the predicate returns false',
		({ Given, When, Then }) => {
			let result: boolean;
			Given('a MemberUserStaffUserVisa for the staff user and member', () => {
				visa = new MemberUserStaffUserVisa(StaffUser, member);
			});
			When(
				'I call determineIf with a function that always returns false',
				() => {
					result = visa.determineIf(() => false);
				},
			);
			Then('the result should be false', () => {
				expect(result).toBe(false);
			});
		},
	);

	Scenario(
		'determineIf always receives all permissions as false',
		({ Given, When, Then }) => {
			let result: boolean;
			Given('a MemberUserStaffUserVisa for the staff user and member', () => {
				visa = new MemberUserStaffUserVisa(StaffUser, member);
			});
			When(
				'I call determineIf with a function that checks all permission flags',
				() => {
					result = visa.determineIf(
						(p) =>
							!p.canManageEndUsers &&
							!p.canManageStaffRolesAndPermissions &&
							!p.canManageStaffUsers &&
							!p.canManageVendorUsers &&
							!p.isEditingOwnAccount &&
							!p.isSystemAccount,
					);
				},
			);
			Then('all permission flags should be false', () => {
				expect(result).toBe(true);
			});
		},
	);

	Scenario(
		'determineIf returns false for canManageEndUsers',
		({ Given, When, Then }) => {
			let result: boolean;
			Given('a MemberUserStaffUserVisa for the staff user and member', () => {
				visa = new MemberUserStaffUserVisa(StaffUser, member);
			});
			When(
				'I call determineIf with a function that returns canManageEndUsers',
				() => {
					result = visa.determineIf((p) => p.canManageEndUsers === true);
				},
			);
			Then('the result should be false', () => {
				expect(result).toBe(false);
			});
		},
	);

	Scenario(
		'determineIf returns false for canManageStaffRolesAndPermissions',
		({ Given, When, Then }) => {
			let result: boolean;
			Given('a MemberUserStaffUserVisa for the staff user and member', () => {
				visa = new MemberUserStaffUserVisa(StaffUser, member);
			});
			When(
				'I call determineIf with a function that returns canManageStaffRolesAndPermissions',
				() => {
					result = visa.determineIf(
						(p) => p.canManageStaffRolesAndPermissions === true,
					);
				},
			);
			Then('the result should be false', () => {
				expect(result).toBe(false);
			});
		},
	);

	Scenario(
		'determineIf returns false for canManageStaffUsers',
		({ Given, When, Then }) => {
			let result: boolean;
			Given('a MemberUserStaffUserVisa for the staff user and member', () => {
				visa = new MemberUserStaffUserVisa(StaffUser, member);
			});
			When(
				'I call determineIf with a function that returns canManageStaffUsers',
				() => {
					result = visa.determineIf((p) => p.canManageStaffUsers === true);
				},
			);
			Then('the result should be false', () => {
				expect(result).toBe(false);
			});
		},
	);

	Scenario(
		'determineIf returns false for canManageVendorUsers',
		({ Given, When, Then }) => {
			let result: boolean;
			Given('a MemberUserStaffUserVisa for the staff user and member', () => {
				visa = new MemberUserStaffUserVisa(StaffUser, member);
			});
			When(
				'I call determineIf with a function that returns canManageVendorUsers',
				() => {
					result = visa.determineIf((p) => p.canManageVendorUsers === true);
				},
			);
			Then('the result should be false', () => {
				expect(result).toBe(false);
			});
		},
	);

	Scenario(
		'determineIf returns false for isEditingOwnAccount',
		({ Given, When, Then }) => {
			let result: boolean;
			Given('a MemberUserStaffUserVisa for the staff user and member', () => {
				visa = new MemberUserStaffUserVisa(StaffUser, member);
			});
			When(
				'I call determineIf with a function that returns isEditingOwnAccount',
				() => {
					result = visa.determineIf((p) => p.isEditingOwnAccount === true);
				},
			);
			Then('the result should be false', () => {
				expect(result).toBe(false);
			});
		},
	);

	Scenario(
		'determineIf returns false for isSystemAccount',
		({ Given, When, Then }) => {
			let result: boolean;
			Given('a MemberUserStaffUserVisa for the staff user and member', () => {
				visa = new MemberUserStaffUserVisa(StaffUser, member);
			});
			When(
				'I call determineIf with a function that returns isSystemAccount',
				() => {
					result = visa.determineIf((p) => p.isSystemAccount === true);
				},
			);
			Then('the result should be false', () => {
				expect(result).toBe(false);
			});
		},
	);
});
