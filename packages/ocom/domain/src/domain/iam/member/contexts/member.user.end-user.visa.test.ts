import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { MemberEntityReference } from '../../../contexts/community/member/member.ts';
import type { EndUserEntityReference } from '../../../contexts/user/end-user/end-user.ts';
import { MemberUserEndUserVisa } from './member.user.end-user.visa.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/member.user.end-user.visa.feature'),
);

function makeEndUser(id = 'user-1') {
	return { id } as EndUserEntityReference;
}

function makeMember(id = 'member-1', accountUserIds: string[] = ['user-1']) {
	return {
		id,
		accounts: accountUserIds.map((userId) => ({
			id: userId,
			user: { id: userId },
		})),
	} as unknown as MemberEntityReference;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let endUser: EndUserEntityReference;
	let member: MemberEntityReference;
	let visa: MemberUserEndUserVisa<EndUserEntityReference>;

	BeforeEachScenario(() => {
		endUser = makeEndUser();
		member = makeMember();
		visa =
			undefined as unknown as MemberUserEndUserVisa<EndUserEntityReference>;
	});

	Background(({ Given, And }) => {
		Given('a valid EndUserEntityReference with id "user-1"', () => {
			endUser = makeEndUser('user-1');
		});
		And(
			'a valid MemberEntityReference with id "member-1" and accounts including "user-1"',
			() => {
				member = makeMember('member-1', ['user-1']);
			},
		);
	});

	Scenario('Creating a MemberUserEndUserVisa', ({ When, Then }) => {
		When(
			'I create a MemberUserEndUserVisa with the end user and member',
			() => {
				visa = new MemberUserEndUserVisa(endUser, member);
			},
		);
		Then('the visa should be created successfully', () => {
			expect(visa).toBeInstanceOf(MemberUserEndUserVisa);
		});
	});

	Scenario(
		'determineIf returns true when the predicate returns true',
		({ Given, When, Then }) => {
			let result: boolean;
			Given('a MemberUserEndUserVisa for the end user and member', () => {
				visa = new MemberUserEndUserVisa(endUser, member);
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
			Given('a MemberUserEndUserVisa for the end user and member', () => {
				visa = new MemberUserEndUserVisa(endUser, member);
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
		"determineIf sets isEditingOwnAccount to true if the member has an account with the end user's id",
		({ Given, And, When, Then }) => {
			let result: boolean;
			Given(
				'a MemberEntityReference with accounts including an account with id "user-1"',
				() => {
					member = makeMember('member-1', ['user-1']);
				},
			);
			And('an EndUserEntityReference with id "user-1"', () => {
				endUser = makeEndUser('user-1');
			});
			When(
				'I create a MemberUserEndUserVisa with the end user and member',
				() => {
					visa = new MemberUserEndUserVisa(endUser, member);
				},
			);
			And(
				'I call determineIf with a function that returns isEditingOwnAccount',
				() => {
					result = visa.determineIf((p) => p.isEditingOwnAccount === true);
				},
			);
			Then('the result should be true', () => {
				expect(result).toBe(true);
			});
		},
	);

	Scenario(
		"determineIf sets isEditingOwnAccount to false if the member does not have an account with the end user's id",
		({ Given, And, When, Then }) => {
			let result: boolean;
			Given(
				'a MemberEntityReference with accounts not including an account with id "user-2"',
				() => {
					member = makeMember('member-1', ['user-3']);
				},
			);
			And('an EndUserEntityReference with id "user-2"', () => {
				endUser = makeEndUser('user-2');
			});
			When(
				'I create a MemberUserEndUserVisa with the end user and member',
				() => {
					visa = new MemberUserEndUserVisa(endUser, member);
				},
			);
			And(
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
		'determineIf returns false for canManageEndUsers',
		({ Given, When, Then }) => {
			let result: boolean;
			Given('a MemberUserEndUserVisa for the end user and member', () => {
				visa = new MemberUserEndUserVisa(endUser, member);
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
			Given('a MemberUserEndUserVisa for the end user and member', () => {
				visa = new MemberUserEndUserVisa(endUser, member);
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
			Given('a MemberUserEndUserVisa for the end user and member', () => {
				visa = new MemberUserEndUserVisa(endUser, member);
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
			Given('a MemberUserEndUserVisa for the end user and member', () => {
				visa = new MemberUserEndUserVisa(endUser, member);
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
		'determineIf returns false for isSystemAccount',
		({ Given, When, Then }) => {
			let result: boolean;
			Given('a MemberUserEndUserVisa for the end user and member', () => {
				visa = new MemberUserEndUserVisa(endUser, member);
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
