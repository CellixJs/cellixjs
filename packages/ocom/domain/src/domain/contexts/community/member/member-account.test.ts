import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import { expect, vi } from 'vitest';
import type { Passport } from '../../passport.ts';
import type { EndUserEntityReference } from '../../user/end-user/end-user.ts';
import type { UserPassport } from '../../user/user.passport.ts';
import type { CommunityVisa } from '../community.visa.ts';
import { MemberAccount, type MemberAccountProps } from './member-account.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/member-account.feature'),
);

function makeVisa(
	overrides: Partial<{
		isSystemAccount: boolean;
		canManageMembers: boolean;
		canEditOwnMemberAccounts: boolean;
		isEditingOwnMemberAccount: boolean;
	}> = {},
): CommunityVisa {
	return vi.mocked({
		determineIf: (
			fn: (p: {
				isSystemAccount: boolean;
				canManageMembers: boolean;
				canEditOwnMemberAccounts: boolean;
				isEditingOwnMemberAccount: boolean;
			}) => boolean,
		) =>
			fn({
				isSystemAccount: overrides.isSystemAccount ?? false,
				canManageMembers: overrides.canManageMembers ?? false,
				canEditOwnMemberAccounts: overrides.canEditOwnMemberAccounts ?? false,
				isEditingOwnMemberAccount: overrides.isEditingOwnMemberAccount ?? false,
			}),
	});
}

function makePassport(): Passport {
	return vi.mocked({
		user: {
			forEndUser: vi.fn(),
			forVendorUser: vi.fn(),
			forStaffUser: vi.fn(),
			forStaffRole: vi.fn(),
		} as UserPassport,
	} as Passport);
}

function makeEndUserEntityReference(id = 'user-1'): EndUserEntityReference {
	return {
		id,
		userType: 'end-user',
		displayName: 'Test User',
	} as EndUserEntityReference;
}

function makeProps(
	overrides: Partial<MemberAccountProps> = {},
): MemberAccountProps {
	return {
		id: 'account-1',
		firstName: 'Alice',
		lastName: 'Smith',
		user: makeEndUserEntityReference('user-1'),
		statusCode: 'active',
		createdBy: makeEndUserEntityReference('user-2'),
		...overrides,
	};
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let visa: ReturnType<typeof makeVisa>;
	let passport: ReturnType<typeof makePassport>;
	let props: MemberAccountProps;
	let entity: MemberAccount;

	BeforeEachScenario(() => {
		visa = makeVisa({ canManageMembers: true });
		passport = makePassport();
		props = makeProps();
		entity = new MemberAccount(props, passport, visa);
	});

	Background(({ Given, And }) => {
		Given(
			'valid MemberAccountProps with firstName "Alice", lastName "Smith", a valid EndUserEntityReference as user, statusCode "active", and a valid EndUserEntityReference as createdBy',
			() => {
				props = makeProps();
			},
		);
		And('a valid CommunityVisa', () => {
			visa = makeVisa({ canManageMembers: true });
		});
		And('a valid Passport', () => {
			passport = makePassport();
		});
	});

	Scenario(
		'Getting firstName, lastName, user, statusCode, and createdBy',
		({ Given, Then, And }) => {
			Given('a MemberAccount entity', () => {
				entity = new MemberAccount(props, passport, visa);
			});
			Then('the firstName property should return "Alice"', () => {
				expect(entity.firstName).toBe('Alice');
			});
			And('the lastName property should return "Smith"', () => {
				expect(entity.lastName).toBe('Smith');
			});
			And(
				'the user property should return the provided EndUserEntityReference',
				() => {
					expect(entity.user.id).toBe('user-1');
				},
			);
			And('the statusCode property should return "active"', () => {
				expect(entity.statusCode).toBe('active');
			});
			And(
				'the createdBy property should return the provided EndUserEntityReference',
				() => {
					expect(entity.createdBy.id).toBe('user-2');
				},
			);
		},
	);

	Scenario(
		'Changing firstName with permission to manage members',
		({ Given, When, Then }) => {
			Given('a MemberAccount entity with permission to manage members', () => {
				visa = makeVisa({ canManageMembers: true });
				entity = new MemberAccount(makeProps(), passport, visa);
			});
			When('I set the firstName to "Bob"', () => {
				entity.firstName = 'Bob';
			});
			Then('the firstName property should return "Bob"', () => {
				expect(entity.firstName).toBe('Bob');
			});
		},
	);

	Scenario(
		'Changing firstName with system account permission',
		({ Given, When, Then }) => {
			Given('a MemberAccount entity with system account permission', () => {
				visa = makeVisa({ isSystemAccount: true });
				entity = new MemberAccount(makeProps(), passport, visa);
			});
			When('I set the firstName to "Bob"', () => {
				entity.firstName = 'Bob';
			});
			Then('the firstName property should return "Bob"', () => {
				expect(entity.firstName).toBe('Bob');
			});
		},
	);

	Scenario(
		'Changing firstName with permission to edit own member account',
		({ Given, When, Then }) => {
			Given(
				'a MemberAccount entity with permission to edit own member accounts and is editing own member account',
				() => {
					visa = makeVisa({
						canEditOwnMemberAccounts: true,
						isEditingOwnMemberAccount: true,
					});
					entity = new MemberAccount(makeProps(), passport, visa);
				},
			);
			When('I set the firstName to "Bob"', () => {
				entity.firstName = 'Bob';
			});
			Then('the firstName property should return "Bob"', () => {
				expect(entity.firstName).toBe('Bob');
			});
		},
	);

	Scenario('Changing firstName without permission', ({ Given, When, Then }) => {
		let setFirstName: () => void;
		Given(
			'a MemberAccount entity without permission to manage members, system account, or edit own member accounts',
			() => {
				visa = makeVisa({
					canManageMembers: false,
					isSystemAccount: false,
					canEditOwnMemberAccounts: false,
					isEditingOwnMemberAccount: false,
				});
				entity = new MemberAccount(makeProps(), passport, visa);
			},
		);
		When('I try to set the firstName to "Bob"', () => {
			setFirstName = () => {
				entity.firstName = 'Bob';
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setFirstName).toThrow(DomainSeedwork.PermissionError);
			expect(setFirstName).toThrow(
				'You do not have permission to update this account',
			);
		});
	});

	Scenario(
		'Changing firstName to an invalid value with permission to manage members',
		({ Given, When, Then }) => {
			let setFirstNameInvalid: () => void;
			Given('a MemberAccount entity with permission to manage members', () => {
				visa = makeVisa({ canManageMembers: true });
				entity = new MemberAccount(makeProps(), passport, visa);
			});
			When(
				'I try to set the firstName to an invalid value (e.g., null or empty string)',
				() => {
					setFirstNameInvalid = () => {
						// @ts-expect-error
						entity.firstName = null;
					};
				},
			);
			Then('an error should be thrown indicating the value is invalid', () => {
				expect(setFirstNameInvalid).throws('Wrong raw value type');
			});
		},
	);

	Scenario(
		'Changing lastName with permission to manage members',
		({ Given, When, Then }) => {
			Given('a MemberAccount entity with permission to manage members', () => {
				visa = makeVisa({ canManageMembers: true });
				entity = new MemberAccount(makeProps(), passport, visa);
			});
			When('I set the lastName to "Johnson"', () => {
				entity.lastName = 'Johnson';
			});
			Then('the lastName property should return "Johnson"', () => {
				expect(entity.lastName).toBe('Johnson');
			});
		},
	);

	Scenario(
		'Changing lastName with system account permission',
		({ Given, When, Then }) => {
			Given('a MemberAccount entity with system account permission', () => {
				visa = makeVisa({ isSystemAccount: true });
				entity = new MemberAccount(makeProps(), passport, visa);
			});
			When('I set the lastName to "Johnson"', () => {
				entity.lastName = 'Johnson';
			});
			Then('the lastName property should return "Johnson"', () => {
				expect(entity.lastName).toBe('Johnson');
			});
		},
	);

	Scenario(
		'Changing lastName with permission to edit own member account',
		({ Given, When, Then }) => {
			Given(
				'a MemberAccount entity with permission to edit own member accounts and is editing own member account',
				() => {
					visa = makeVisa({
						canEditOwnMemberAccounts: true,
						isEditingOwnMemberAccount: true,
					});
					entity = new MemberAccount(makeProps(), passport, visa);
				},
			);
			When('I set the lastName to "Johnson"', () => {
				entity.lastName = 'Johnson';
			});
			Then('the lastName property should return "Johnson"', () => {
				expect(entity.lastName).toBe('Johnson');
			});
		},
	);

	Scenario('Changing lastName without permission', ({ Given, When, Then }) => {
		let setLastName: () => void;
		Given(
			'a MemberAccount entity without permission to manage members, system account, or edit own member accounts',
			() => {
				visa = makeVisa({
					canManageMembers: false,
					isSystemAccount: false,
					canEditOwnMemberAccounts: false,
					isEditingOwnMemberAccount: false,
				});
				entity = new MemberAccount(makeProps(), passport, visa);
			},
		);
		When('I try to set the lastName to "Johnson"', () => {
			setLastName = () => {
				entity.lastName = 'Johnson';
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setLastName).toThrow(DomainSeedwork.PermissionError);
			expect(setLastName).toThrow(
				'You do not have permission to update this account',
			);
		});
	});

	Scenario(
		'Changing lastName to an invalid value with permission to manage members',
		({ Given, When, Then }) => {
			let setLastNameInvalid: () => void;
			Given('a MemberAccount entity with permission to manage members', () => {
				visa = makeVisa({ canManageMembers: true });
				entity = new MemberAccount(makeProps(), passport, visa);
			});
			When(
				'I try to set the lastName to an invalid value (e.g., null or empty string)',
				() => {
					setLastNameInvalid = () => {
						// @ts-expect-error
						entity.lastName = null;
					};
				},
			);
			Then('an error should be thrown indicating the value is invalid', () => {
				expect(setLastNameInvalid).throws('Wrong raw value type');
			});
		},
	);

	Scenario(
		'Changing user with permission to manage members',
		({ Given, When, Then }) => {
			let newUser: EndUserEntityReference;
			Given('a MemberAccount entity with permission to manage members', () => {
				visa = makeVisa({ canManageMembers: true });
				entity = new MemberAccount(makeProps(), passport, visa);
				newUser = makeEndUserEntityReference('user-2');
			});
			When('I set the user to a new EndUserEntityReference', () => {
				entity.user = newUser;
			});
			Then(
				'the user property should return the new EndUserEntityReference',
				() => {
					expect(entity.user.id).toBe('user-2');
				},
			);
		},
	);

	Scenario(
		'Changing user with system account permission',
		({ Given, When, Then }) => {
			let newUser: EndUserEntityReference;
			Given('a MemberAccount entity with system account permission', () => {
				visa = makeVisa({ isSystemAccount: true });
				entity = new MemberAccount(makeProps(), passport, visa);
				newUser = makeEndUserEntityReference('user-2');
			});
			When('I set the user to a new EndUserEntityReference', () => {
				entity.user = newUser;
			});
			Then(
				'the user property should return the new EndUserEntityReference',
				() => {
					expect(entity.user.id).toBe('user-2');
				},
			);
		},
	);

	Scenario(
		'Changing user with permission to edit own member account',
		({ Given, When, Then }) => {
			let newUser: EndUserEntityReference;
			Given(
				'a MemberAccount entity with permission to edit own member accounts and is editing own member account',
				() => {
					visa = makeVisa({
						canEditOwnMemberAccounts: true,
						isEditingOwnMemberAccount: true,
					});
					entity = new MemberAccount(makeProps(), passport, visa);
					newUser = makeEndUserEntityReference('user-2');
				},
			);
			When('I set the user to a new EndUserEntityReference', () => {
				entity.user = newUser;
			});
			Then(
				'the user property should return the new EndUserEntityReference',
				() => {
					expect(entity.user.id).toBe('user-2');
				},
			);
		},
	);

	Scenario('Changing user without permission', ({ Given, When, Then }) => {
		let setUser: () => void;
		let newUser: EndUserEntityReference;
		Given(
			'a MemberAccount entity without permission to manage members, system account, or edit own member accounts',
			() => {
				visa = makeVisa({
					canManageMembers: false,
					isSystemAccount: false,
					canEditOwnMemberAccounts: false,
					isEditingOwnMemberAccount: false,
				});
				entity = new MemberAccount(makeProps(), passport, visa);
				newUser = makeEndUserEntityReference('user-2');
			},
		);
		When('I try to set the user to a new EndUserEntityReference', () => {
			setUser = () => {
				entity.user = newUser;
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setUser).toThrow(DomainSeedwork.PermissionError);
			expect(setUser).toThrow(
				'You do not have permission to update this account',
			);
		});
	});

	Scenario(
		'Changing statusCode with permission to manage members',
		({ Given, When, Then }) => {
			Given('a MemberAccount entity with permission to manage members', () => {
				visa = makeVisa({ canManageMembers: true });
				entity = new MemberAccount(makeProps(), passport, visa);
			});
			When('I set the statusCode to "ACCEPTED"', () => {
				entity.statusCode = 'ACCEPTED';
			});
			Then('the statusCode property should return "ACCEPTED"', () => {
				expect(entity.statusCode).toBe('ACCEPTED');
			});
		},
	);

	Scenario(
		'Changing statusCode with system account permission',
		({ Given, When, Then }) => {
			Given('a MemberAccount entity with system account permission', () => {
				visa = makeVisa({ isSystemAccount: true });
				entity = new MemberAccount(makeProps(), passport, visa);
			});
			When('I set the statusCode to "ACCEPTED"', () => {
				entity.statusCode = 'ACCEPTED';
			});
			Then('the statusCode property should return "ACCEPTED"', () => {
				expect(entity.statusCode).toBe('ACCEPTED');
			});
		},
	);

	Scenario(
		'Changing statusCode without permission',
		({ Given, When, Then }) => {
			let setStatusCode: () => void;
			Given(
				'a MemberAccount entity without permission to manage members or system account',
				() => {
					visa = makeVisa({ canManageMembers: false, isSystemAccount: false });
					entity = new MemberAccount(makeProps(), passport, visa);
				},
			);
			When('I try to set the statusCode to "ACCEPTED"', () => {
				setStatusCode = () => {
					entity.statusCode = 'ACCEPTED';
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(setStatusCode).toThrow(DomainSeedwork.PermissionError);
				expect(setStatusCode).toThrow(
					'You do not have permission to update this account',
				);
			});
		},
	);

	Scenario(
		'Changing statusCode to an invalid value with permission to manage members',
		({ Given, When, Then }) => {
			let setStatusCodeInvalid: () => void;
			Given('a MemberAccount entity with permission to manage members', () => {
				visa = makeVisa({ canManageMembers: true });
				entity = new MemberAccount(makeProps(), passport, visa);
			});
			When(
				'I try to set the statusCode to an invalid value (e.g., null or empty string)',
				() => {
					setStatusCodeInvalid = () => {
						// @ts-expect-error
						entity.statusCode = null;
					};
				},
			);
			Then('an error should be thrown indicating the value is invalid', () => {
				expect(setStatusCodeInvalid).throws('Wrong raw value type');
			});
		},
	);

	Scenario(
		'Changing createdBy with permission to manage members',
		({ Given, When, Then }) => {
			let newCreatedBy: EndUserEntityReference;
			Given('a MemberAccount entity with permission to manage members', () => {
				visa = makeVisa({ canManageMembers: true });
				entity = new MemberAccount(makeProps(), passport, visa);
				newCreatedBy = makeEndUserEntityReference('user-3');
			});
			When('I set the createdBy to a new EndUserEntityReference', () => {
				entity.createdBy = newCreatedBy;
			});
			Then(
				'the createdBy property should return the new EndUserEntityReference',
				() => {
					expect(entity.createdBy.id).toBe('user-3');
				},
			);
		},
	);

	Scenario(
		'Changing createdBy with system account permission',
		({ Given, When, Then }) => {
			let newCreatedBy: EndUserEntityReference;
			Given('a MemberAccount entity with system account permission', () => {
				visa = makeVisa({ isSystemAccount: true });
				entity = new MemberAccount(makeProps(), passport, visa);
				newCreatedBy = makeEndUserEntityReference('user-3');
			});
			When('I set the createdBy to a new EndUserEntityReference', () => {
				entity.createdBy = newCreatedBy;
			});
			Then(
				'the createdBy property should return the new EndUserEntityReference',
				() => {
					expect(entity.createdBy.id).toBe('user-3');
				},
			);
		},
	);

	Scenario(
		'Changing createdBy with permission to edit own member account',
		({ Given, When, Then }) => {
			let newCreatedBy: EndUserEntityReference;
			Given(
				'a MemberAccount entity with permission to edit own member accounts and is editing own member account',
				() => {
					visa = makeVisa({
						canEditOwnMemberAccounts: true,
						isEditingOwnMemberAccount: true,
					});
					entity = new MemberAccount(makeProps(), passport, visa);
					newCreatedBy = makeEndUserEntityReference('user-3');
				},
			);
			When('I set the createdBy to a new EndUserEntityReference', () => {
				entity.createdBy = newCreatedBy;
			});
			Then(
				'the createdBy property should return the new EndUserEntityReference',
				() => {
					expect(entity.createdBy.id).toBe('user-3');
				},
			);
		},
	);

	Scenario('Changing createdBy without permission', ({ Given, When, Then }) => {
		let setCreatedBy: () => void;
		let newCreatedBy: EndUserEntityReference;
		Given(
			'a MemberAccount entity without permission to manage members, system account, or edit own member accounts',
			() => {
				visa = makeVisa({
					canManageMembers: false,
					isSystemAccount: false,
					canEditOwnMemberAccounts: false,
					isEditingOwnMemberAccount: false,
				});
				entity = new MemberAccount(makeProps(), passport, visa);
				newCreatedBy = makeEndUserEntityReference('user-3');
			},
		);
		When('I try to set the createdBy to a new EndUserEntityReference', () => {
			setCreatedBy = () => {
				entity.createdBy = newCreatedBy;
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setCreatedBy).toThrow(DomainSeedwork.PermissionError);
			expect(setCreatedBy).toThrow(
				'You do not have permission to update this account',
			);
		});
	});
});
