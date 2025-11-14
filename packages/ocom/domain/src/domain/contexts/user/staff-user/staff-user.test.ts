import { CustomDomainEvent } from '@cellix/domain-seedwork/domain-event';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';

import { StaffUser, type StaffUserProps } from './staff-user.ts';
import { StaffUserCreatedEvent } from '../../../events/types/staff-user-created.ts';
import type { Passport } from '../../passport.ts';

const test = { for: describeFeature };
import type {
	StaffRoleEntityReference,
	StaffRoleProps,
} from '../staff-role/staff-role.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/staff-user.feature'),
);

function makePassport(canManageStaffRolesAndPermissions = true): Passport {
	return vi.mocked({
		user: {
			forStaffUser: vi.fn(() => ({
				determineIf: (
					fn: (p: { canManageStaffRolesAndPermissions: boolean }) => boolean,
				) => fn({ canManageStaffRolesAndPermissions }),
			})),
            forStaffRole: vi.fn(() => ({
                determineIf: (
                    fn: (p: { canManageStaffRolesAndPermissions: boolean }) => boolean,
                ) => fn({ canManageStaffRolesAndPermissions }),
            })),
		},
	} as unknown as Passport);
}

// function makeStaffRoleEntityReference(id: string): StaffRoleEntityReference {
//   return { id } as StaffRoleEntityReference;
// }

function makeBaseProps(
	overrides: Partial<StaffUserProps> = {},
): StaffUserProps {
    let _role: StaffRoleEntityReference | undefined = vi.mocked({
        roleName: 'test role',
        roleType: 'staff-role',
    } as StaffRoleProps);
	return {
		id: 'staff-1',
		firstName: 'Alice',
		lastName: 'Smith',
		email: 'alice@cellix.com',
		displayName: 'Alice Smith',
		externalId: '123e4567-e89b-12d3-a456-426614174000',
		accessBlocked: false,
		tags: [],
		userType: 'staff-user',
		createdAt: new Date('2020-01-01T00:00:00Z'),
		updatedAt: new Date('2020-01-02T00:00:00Z'),
		schemaVersion: '1.0.0',
        get role() {
            return _role as StaffRoleEntityReference;
        },
		setRoleRef: (role: StaffRoleEntityReference | undefined) => {
         _role = role;
        },
		...overrides,
	};
}

function getIntegrationEvent<T>(
	events: readonly CustomDomainEvent<unknown>[],
	eventClass: new (aggregateId: string) => T,
): T | undefined {
	return events.find((e) => e instanceof eventClass) as T | undefined;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let passport: Passport;
	let baseProps: StaffUserProps;
	let staffUser: StaffUser<StaffUserProps>;
	let newStaffUser: StaffUser<StaffUserProps>;

	BeforeEachScenario(() => {
		passport = makePassport(true);
		baseProps = makeBaseProps();
		staffUser = new StaffUser(baseProps, passport);
		newStaffUser = undefined as unknown as StaffUser<StaffUserProps>;
	});

	Background(({ Given, And }) => {
		Given('a valid Passport with staff user permissions', () => {
			passport = makePassport(true);
		});
		And(
			'base staff user properties with firstName "Alice", lastName "Smith", email "alice@cellix.com", displayName "Alice Smith", externalId "123e4567-e89b-12d3-a456-426614174000", accessBlocked false, tags [], userType "staff", and valid timestamps',
			() => {
				baseProps = makeBaseProps();
				staffUser = new StaffUser(baseProps, passport);
			},
		);
	});

	Scenario('Creating a new staff user instance', ({ When, Then, And }) => {
		When(
			'I create a new StaffUser aggregate using getNewUser with firstName "Alice", lastName "Smith", email "alice@cellix.com", and externalId "123e4567-e89b-12d3-a456-426614174000"',
			() => {
				newStaffUser = StaffUser.getNewUser(
					makeBaseProps(),
					passport,
					'123e4567-e89b-12d3-a456-426614174000',
					'Alice',
					'Smith',
					'alice@cellix.com',
				);
			},
		);
		Then('the staff user\'s firstName should be "Alice"', () => {
			expect(newStaffUser.firstName).toBe('Alice');
		});
		And('the staff user\'s lastName should be "Smith"', () => {
			expect(newStaffUser.lastName).toBe('Smith');
		});
		And('the staff user\'s email should be "alice@cellix.com"', () => {
			expect(newStaffUser.email).toBe('alice@cellix.com');
		});
		And('the staff user\'s displayName should be "Alice Smith"', () => {
			expect(newStaffUser.displayName).toBe('Alice Smith');
		});
		And('the staff user\'s externalId should be "123e4567-e89b-12d3-a456-426614174000"', () => {
			expect(newStaffUser.externalId).toBe('123e4567-e89b-12d3-a456-426614174000');
		});
		And('a StaffUserCreatedEvent should be added to integration events', () => {
			const event = getIntegrationEvent(
				newStaffUser.getIntegrationEvents(),
				StaffUserCreatedEvent,
			);
			expect(event).toBeDefined();
			expect(event).toBeInstanceOf(StaffUserCreatedEvent);
		});
	});

	// firstName
	Scenario(
		'Changing the firstName with permission',
		({ Given, When, Then }) => {
			Given(
				'a StaffUser aggregate with permission to manage staff roles and permissions',
				() => {
					passport = makePassport(true);
					staffUser = new StaffUser(makeBaseProps(), passport);
				},
			);
			When('I set the firstName to "Bob"', () => {
				staffUser.firstName = 'Bob';
			});
			Then('the staff user\'s firstName should be "Bob"', () => {
				expect(staffUser.firstName).toBe('Bob');
			});
		},
	);

	Scenario(
		'Changing the firstName without permission',
		({ Given, When, Then }) => {
			let changingFirstNameWithoutPermission: () => void;
			Given(
				'a StaffUser aggregate without permission to manage staff roles and permissions',
				() => {
					passport = makePassport(false);
					staffUser = new StaffUser(makeBaseProps(), passport);
				},
			);
			When('I try to set the firstName to "Bob"', () => {
				changingFirstNameWithoutPermission = () => {
					staffUser.firstName = 'Bob';
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(changingFirstNameWithoutPermission).toThrow(
					PermissionError,
				);
			});
		},
	);

	Scenario(
		'Changing the firstName to an invalid value',
		({ Given, When, Then }) => {
			let changingFirstNameToNull: () => void;
			let changingFirstNameToEmptyString: () => void;
			Given(
				'a StaffUser aggregate with permission to manage staff roles and permissions',
				() => {
					passport = makePassport(true);
					staffUser = new StaffUser(makeBaseProps(), passport);
				},
			);
			When(
				'I try to set the firstName to an invalid value (e.g., null or empty string)',
				() => {
					changingFirstNameToNull = () => {
						// @ts-expect-error
						staffUser.firstName = null;
					};
					changingFirstNameToEmptyString = () => {
						staffUser.firstName = '';
					};
				},
			);
			Then(
				'an error should be thrown indicating the value is invalid',
				() => {
					expect(changingFirstNameToNull).throws('Wrong raw value type');
					expect(changingFirstNameToEmptyString).throws('Too short');
				},
			);
		},
	);

	// lastName
	Scenario('Changing the lastName with permission', ({ Given, When, Then }) => {
		Given(
			'a StaffUser aggregate with permission to manage staff roles and permissions',
			() => {
				passport = makePassport(true);
				staffUser = new StaffUser(makeBaseProps(), passport);
			},
		);
		When('I set the lastName to "Johnson"', () => {
			staffUser.lastName = 'Johnson';
		});
		Then('the staff user\'s lastName should be "Johnson"', () => {
			expect(staffUser.lastName).toBe('Johnson');
		});
	});

	Scenario(
		'Changing the lastName without permission',
		({ Given, When, Then }) => {
			let changingLastNameWithoutPermission: () => void;
			Given(
				'a StaffUser aggregate without permission to manage staff roles and permissions',
				() => {
					passport = makePassport(false);
					staffUser = new StaffUser(makeBaseProps(), passport);
				},
			);
			When('I try to set the lastName to "Johnson"', () => {
				changingLastNameWithoutPermission = () => {
					staffUser.lastName = 'Johnson';
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(changingLastNameWithoutPermission).toThrow(
					PermissionError,
				);
				expect(changingLastNameWithoutPermission).toThrow('Unauthorized');
			});
		},
	);

	Scenario(
		'Changing the lastName to an invalid value',
		({ Given, When, Then }) => {
			let changingLastNameToNull: () => void;
			let changingLastNameToEmptyString: () => void;
			Given(
				'a StaffUser aggregate with permission to manage staff roles and permissions',
				() => {
					passport = makePassport(true);
					staffUser = new StaffUser(makeBaseProps(), passport);
				},
			);
			When(
				'I try to set the lastName to an invalid value (e.g., null or empty string)',
				() => {
					changingLastNameToNull = () => {
						// @ts-expect-error
						staffUser.lastName = null;
					};
					changingLastNameToEmptyString = () => {
						staffUser.lastName = '';
					};
				},
			);
			Then(
				'an error should be thrown indicating the value is invalid',
				() => {
					expect(changingLastNameToNull).throws('Wrong raw value type');
					expect(changingLastNameToEmptyString).throws('Too short');
				},
			);
		},
	);

	// displayName
	Scenario(
		'Changing the displayName with permission',
		({ Given, When, Then }) => {
			Given(
				'a StaffUser aggregate with permission to manage staff roles and permissions',
				() => {
					passport = makePassport(true);
					staffUser = new StaffUser(makeBaseProps(), passport);
				},
			);
			When('I set the displayName to "Alice J. Smith"', () => {
				staffUser.displayName = 'Alice J. Smith';
			});
			Then('the staff user\'s displayName should be "Alice J. Smith"', () => {
				expect(staffUser.displayName).toBe('Alice J. Smith');
			});
		},
	);

	Scenario(
		'Changing the displayName without permission',
		({ Given, When, Then }) => {
			let changingDisplayNameWithoutPermission: () => void;
			Given(
				'a StaffUser aggregate without permission to manage staff roles and permissions',
				() => {
					passport = makePassport(false);
					staffUser = new StaffUser(makeBaseProps(), passport);
				},
			);
			When('I try to set the displayName to "Alice J. Smith"', () => {
				changingDisplayNameWithoutPermission = () => {
					staffUser.displayName = 'Alice J. Smith';
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(changingDisplayNameWithoutPermission).toThrow(
					PermissionError,
				);
				expect(changingDisplayNameWithoutPermission).toThrow('Unauthorized');
			});
		},
	);

	Scenario(
		'Changing the displayName to an invalid value',
		({ Given, When, Then }) => {
			let changingDisplayNameToNull: () => void;
			let changingDisplayNameToEmptyString: () => void;
			Given(
				'a StaffUser aggregate with permission to manage staff roles and permissions',
				() => {
					passport = makePassport(true);
					staffUser = new StaffUser(makeBaseProps(), passport);
				},
			);
			When(
				'I try to set the displayName to an invalid value (e.g., null or empty string)',
				() => {
					changingDisplayNameToNull = () => {
						// @ts-expect-error
						staffUser.displayName = null;
					};
					changingDisplayNameToEmptyString = () => {
						staffUser.displayName = '';
					};
				},
			);
			Then(
				'an error should be thrown indicating the value is invalid',
				() => {
					expect(changingDisplayNameToNull).throws('Wrong raw value type');
					expect(changingDisplayNameToEmptyString).throws('Too short');
				},
			);
		},
	);

	// email
	Scenario('Changing the email with permission', ({ Given, When, Then }) => {
		Given(
			'a StaffUser aggregate with permission to manage staff roles and permissions',
			() => {
				passport = makePassport(true);
				staffUser = new StaffUser(makeBaseProps(), passport);
			},
		);
		When('I set the email to "bob@cellix.com"', () => {
			staffUser.email = 'bob@cellix.com';
		});
		Then('the staff user\'s email should be "bob@cellix.com"', () => {
			expect(staffUser.email).toBe('bob@cellix.com');
		});
	});

	Scenario('Changing the email without permission', ({ Given, When, Then }) => {
		let changingEmailWithoutPermission: () => void;
		Given(
			'a StaffUser aggregate without permission to manage staff roles and permissions',
			() => {
				passport = makePassport(false);
				staffUser = new StaffUser(makeBaseProps(), passport);
			},
		);
		When('I try to set the email to "bob@cellix.com"', () => {
			changingEmailWithoutPermission = () => {
				staffUser.email = 'bob@cellix.com';
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(changingEmailWithoutPermission).toThrow(
				PermissionError,
			);
			expect(changingEmailWithoutPermission).throws('Unauthorized');
		});
	});

    Scenario('Changing the email to an invalid value', ({ Given, When, Then }) => {
        let changingEmailToInvalidEmail: () => void;
        Given(
            'a StaffUser aggregate with permission to manage staff roles and permissions',
            () => {
                passport = makePassport(true);
                staffUser = new StaffUser(makeBaseProps(), passport);
            },
        );
        When('I try to set the email to "not-an-email"', () => {
            changingEmailToInvalidEmail = () => {
                staffUser.email = 'not-an-email';
            };
        });
        Then('an error should be thrown indicating the value is invalid', () => {
            expect(changingEmailToInvalidEmail).throws('Value doesn\'t match pattern');
        });
    });

    // externalId
    Scenario('Changing the externalId with permission', ({ Given, When, Then }) => {
        Given(
            'a StaffUser aggregate with permission to manage staff roles and permissions',
            () => {
                passport = makePassport(true);
                staffUser = new StaffUser(makeBaseProps(), passport);
            },
        );
        When('I set the externalId to "123e4567-e89b-12d3-a456-426614174000"', () => {
            staffUser.externalId = '123e4567-e89b-12d3-a456-426614174000';
        });
        Then('the staff user\'s externalId should be "123e4567-e89b-12d3-a456-426614174000"', () => {
            expect(staffUser.externalId).toBe('123e4567-e89b-12d3-a456-426614174000');
        });
    });

    Scenario('Changing the externalId without permission', ({ Given, When, Then }) => {
        let changingExternalIdWithoutPermission: () => void;
        Given(
            'a StaffUser aggregate without permission to manage staff roles and permissions',
            () => {
                passport = makePassport(false);
                staffUser = new StaffUser(makeBaseProps(), passport);
            },
        );
        When('I try to set the externalId to "123e4567-e89b-12d3-a456-426614174000"', () => {
            changingExternalIdWithoutPermission = () => {
                staffUser.externalId = '123e4567-e89b-12d3-a456-426614174000';
            };
        });
        Then('a PermissionError should be thrown', () => {
            expect(changingExternalIdWithoutPermission).toThrow(
                PermissionError,
            );
            expect(changingExternalIdWithoutPermission).throws('Unauthorized');
        });
    });

    Scenario('Changing the externalId to an invalid value', ({ Given, When, Then }) => {
        let changingExternalIdToInvalid: () => void;
        Given(
            'a StaffUser aggregate with permission to manage staff roles and permissions',
            () => {
                passport = makePassport(true);
                staffUser = new StaffUser(makeBaseProps(), passport);
            },
        );
        When('I try to set the externalId to an invalid value', () => {
            changingExternalIdToInvalid = () => {
                staffUser.externalId = 'a'.repeat(36);
            };
        });
        Then('an error should be thrown indicating the value is invalid', () => {
            expect(changingExternalIdToInvalid).throws('Value doesn\'t match pattern');
        });
    });

    // accessBlocked
    Scenario('Changing accessBlocked with permission', ({ Given, When, Then }) => {
        Given(
            'a StaffUser aggregate with permission to manage staff roles and permissions',
            () => {
                passport = makePassport(true);
                staffUser = new StaffUser(makeBaseProps(), passport);
            },
        );
        When('I set accessBlocked to true', () => {
            staffUser.accessBlocked = true;
        });
        Then('the staff user\'s accessBlocked should be true', () => {
            expect(staffUser.accessBlocked).toBe(true);
        });
    });

    Scenario('Changing accessBlocked without permission', ({ Given, When, Then }) => {
        let changingAccessBlockedWithoutPermission: () => void;
        Given(
            'a StaffUser aggregate without permission to manage staff roles and permissions',
            () => {
                passport = makePassport(false);
                staffUser = new StaffUser(makeBaseProps(), passport);
            },
        );
        When('I try to set accessBlocked to true', () => {
            changingAccessBlockedWithoutPermission = () => {
                staffUser.accessBlocked = true;
            };
        });
        Then('a PermissionError should be thrown', () => {
            expect(changingAccessBlockedWithoutPermission).toThrow(
                PermissionError,
            );
            expect(changingAccessBlockedWithoutPermission).throws('Unauthorized');
        });
    });

    // tags
    Scenario('Changing tags with permission', ({ Given, When, Then }) => {
        Given(
            'a StaffUser aggregate with permission to manage staff roles and permissions',
            () => {
                passport = makePassport(true);
                staffUser = new StaffUser(makeBaseProps(), passport);  
            }
        );
        When('I set tags to ["admin", "support"]', () => {
            staffUser.tags = ['admin', 'support'];
        });
        Then('the staff user\'s tags should be ["admin", "support"]', () => {
            expect(staffUser.tags).toEqual(['admin', 'support']);
        });
    });

    Scenario('Changing tags without permission', ({ Given, When, Then }) => {
        let changingTagsWithoutPermission: () => void;
        Given(
            'a StaffUser aggregate without permission to manage staff roles and permissions',
            () => {
                passport = makePassport(false);
                staffUser = new StaffUser(makeBaseProps(), passport);
            },
        );
        When('I try to set tags to ["admin", "support"]', () => {
            changingTagsWithoutPermission = () => {
                staffUser.tags = ['admin', 'support'];
            };
        });
        Then('a PermissionError should be thrown', () => {
            expect(changingTagsWithoutPermission).toThrow(
                PermissionError,
            );
            expect(changingTagsWithoutPermission).throws('Unauthorized');
        });
    });

    // role
    Scenario('Changing the role with permission', ({ Given, When, Then }) => {
        Given(
            'a StaffUser aggregate with permission to manage staff roles and permissions',
            () => {
                passport = makePassport(true);
                staffUser = new StaffUser(makeBaseProps(), passport);
            },
        );
        When('I set the role to a valid staff role', () => {
            const newRole = vi.mocked({
                id: 'role-1',
                roleName: 'New Role',
                roleType: 'staff-role'
            } as StaffRoleEntityReference);
            staffUser.role = newRole;
        });
        Then('the staff user\'s role should be updated', () => {
            expect(staffUser?.role?.id).toBe('role-1');
            expect(staffUser?.role?.roleName).toBe('New Role');
        });
    });

    Scenario('Changing the role without permission', ({ Given, When, Then }) => {
        let changingRoleWithoutPermission: () => void;
        Given(
            'a StaffUser aggregate without permission to manage staff roles and permissions',
            () => {
                passport = makePassport(false);
                staffUser = new StaffUser(makeBaseProps(), passport);
            },
        );
        When('I try to set the role to a valid staff role', () => {
            const newRole = {
                id: 'role-1',
                roleName: 'New Role',
                roleType: 'staff-role',
            } as StaffRoleEntityReference;
            changingRoleWithoutPermission = () => {
                staffUser.role = newRole;
            };
        });
        Then('a PermissionError should be thrown', () => {
            expect(changingRoleWithoutPermission).toThrow(
                PermissionError,
            );
            expect(changingRoleWithoutPermission).throws('Unauthorized');
        });
    });

    Scenario('Clearing the role with permission', ({ Given, When, Then }) => {
        Given(
            'a StaffUser aggregate with permission to manage staff roles and permissions',
            () => {
                passport = makePassport(true);
                staffUser = new StaffUser(makeBaseProps(), passport);
            },
        );
        When('I clear the role', () => {
            staffUser.role = undefined;
        });
        Then('the staff user\'s role should be undefined', () => {
            expect(staffUser.role).toBeUndefined();
        });
    });

    // readonly properties
    Scenario('Getting userType, createdAt, updatedAt, and schemaVersion', ({ Given, Then, And }) => {
        Given('a StaffUser aggregate', () => {
            passport = makePassport(true);
            staffUser = new StaffUser(makeBaseProps(), passport);
        });
        Then('the userType property should return the correct type', () => {
            expect(staffUser.userType).toBe('staff-user');
        });
        And('the createdAt property should return the correct date', () => {
            expect(staffUser.createdAt).toEqual(new Date('2020-01-01T00:00:00Z'));
        });
        And('the updatedAt property should return the correct date', () => {
            expect(staffUser.updatedAt).toEqual(new Date('2020-01-02T00:00:00Z'));
        });
        And('the schemaVersion property should return the correct version', () => {
            expect(staffUser.schemaVersion).toBe('1.0.0');
        });
    });

	// Repeat the above pattern for lastName, displayName, email, externalId, accessBlocked, tags, role, and read-only properties.
	// For brevity, only firstName scenarios are shown here.
});
