import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { expect, vi } from 'vitest';
import { RoleDeletedReassignEvent } from '../../../events/types/role-deleted-reassign.ts';
import type { Passport } from '../../passport.ts';
import {
	StaffRole,
	type StaffRoleEntityReference,
	type StaffRoleProps,
} from './staff-role.ts';
import { StaffRolePermissions } from './staff-role-permissions.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/staff-role.feature'),
);

function makePassport(
	canManageStaffRolesAndPermissions = true,
	isSystemAccount = false,
): Passport {
	return vi.mocked({
		user: {
			forStaffRole: vi.fn(() => ({
				determineIf: (
					fn: (p: {
						canManageStaffRolesAndPermissions: boolean;
						isSystemAccount: boolean;
					}) => boolean,
				) => fn({ canManageStaffRolesAndPermissions, isSystemAccount }),
			})),
		},
	// biome-ignore lint/plugin/no-type-assertion: test file
	} as unknown as Passport);
}

function makeBaseProps(
	overrides: Partial<StaffRoleProps> = {},
): StaffRoleProps {
	return {
		id: 'role-1',
		roleName: 'Support',
		isDefault: false,
		// biome-ignore lint/plugin/no-type-assertion: test file
		permissions: {} as StaffRolePermissions,
		roleType: 'staff-role',
		createdAt: new Date('2020-01-01T00:00:00Z'),
		updatedAt: new Date('2020-01-02T00:00:00Z'),
		schemaVersion: '1.0.0',
		...overrides,
	};
}

function getIntegrationEvent<T>(
	events: readonly unknown[],
	eventClass: new (aggregateId: string) => T,
): T | undefined {
	// biome-ignore lint/plugin/no-type-assertion: test file
	return events.find((e) => e instanceof eventClass) as T | undefined;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let passport: Passport;
	let baseProps: StaffRoleProps;
	let staffRole: StaffRole<StaffRoleProps>;
	let newStaffRole: StaffRole<StaffRoleProps>;

	BeforeEachScenario(() => {
		passport = makePassport(true, false);
		baseProps = makeBaseProps();
		staffRole = new StaffRole(baseProps, passport);
		// biome-ignore lint/plugin/no-type-assertion: test file
		newStaffRole = undefined as unknown as StaffRole<StaffRoleProps>;
	});

	Background(({ Given, And }) => {
		Given('a valid Passport with staff role permissions', () => {
			passport = makePassport(true, false);
		});
		And(
			'base staff role properties with roleName "Support", isDefault false, roleType "staff-role", and valid timestamps',
			() => {
				baseProps = makeBaseProps();
				staffRole = new StaffRole(baseProps, passport);
			},
		);
	});

	Scenario('Creating a new staff role instance', ({ When, Then, And }) => {
		When(
			'I create a new StaffRole aggregate using getNewInstance with roleName "Support" and isDefault false',
			() => {
				newStaffRole = StaffRole.getNewInstance(
					makeBaseProps(),
					passport,
					'Support',
					false,
				);
			},
		);
		Then('the staff role\'s roleName should be "Support"', () => {
			expect(newStaffRole.roleName).toBe('Support');
		});
		And("the staff role's isDefault should be false", () => {
			expect(newStaffRole.isDefault).toBe(false);
		});
	});

	// roleName
	Scenario(
		'Changing the roleName with permission to manage staff roles',
		({ Given, When, Then }) => {
			Given(
				'a StaffRole aggregate with permission to manage staff roles and permissions',
				() => {
					passport = makePassport(true, false);
					staffRole = new StaffRole(makeBaseProps(), passport);
				},
			);
			When('I set the roleName to "Manager"', () => {
				staffRole.roleName = 'Manager';
			});
			Then('the staff role\'s roleName should be "Manager"', () => {
				expect(staffRole.roleName).toBe('Manager');
			});
		},
	);

	Scenario(
		'Changing the roleName with system account permission',
		({ Given, When, Then }) => {
			Given('a StaffRole aggregate with system account permission', () => {
				passport = makePassport(false, true);
				staffRole = new StaffRole(makeBaseProps(), passport);
			});
			When('I set the roleName to "Manager"', () => {
				staffRole.roleName = 'Manager';
			});
			Then('the staff role\'s roleName should be "Manager"', () => {
				expect(staffRole.roleName).toBe('Manager');
			});
		},
	);

	Scenario(
		'Changing the roleName without permission',
		({ Given, When, Then }) => {
			let changingRoleNameWithoutPermission: () => void;
			Given(
				'a StaffRole aggregate without permission to manage staff roles and permissions or system account',
				() => {
					passport = makePassport(false, false);
					staffRole = new StaffRole(makeBaseProps(), passport);
				},
			);
			When('I try to set the roleName to "Manager"', () => {
				changingRoleNameWithoutPermission = () => {
					staffRole.roleName = 'Manager';
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(changingRoleNameWithoutPermission).toThrow(PermissionError);
				expect(changingRoleNameWithoutPermission).toThrow(
					'Cannot set role name',
				);
			});
		},
	);

	Scenario(
		'Changing the roleName to an invalid value',
		({ Given, When, Then }) => {
			let changingRoleNameToInvalidValue: () => void;
			Given(
				'a StaffRole aggregate with permission to manage staff roles and permissions',
				() => {
					passport = makePassport(true, false);
					staffRole = new StaffRole(makeBaseProps(), passport);
				},
			);
			When(
				'I try to set the roleName to an invalid value (e.g., empty string)',
				() => {
					changingRoleNameToInvalidValue = () => {
						staffRole.roleName = '';
					};
				},
			);
			Then('an error should be thrown indicating the value is invalid', () => {
				expect(changingRoleNameToInvalidValue).throws('Too short');
			});
		},
	);

	// isDefault
	Scenario(
		'Changing isDefault with permission to manage staff roles',
		({ Given, When, Then }) => {
			Given(
				'a StaffRole aggregate with permission to manage staff roles and permissions',
				() => {
					passport = makePassport(true, false);
					staffRole = new StaffRole(makeBaseProps(), passport);
				},
			);
			When('I set isDefault to true', () => {
				staffRole.isDefault = true;
			});
			Then("the staff role's isDefault should be true", () => {
				expect(staffRole.isDefault).toBe(true);
			});
		},
	);

	Scenario(
		'Changing isDefault with system account permission',
		({ Given, When, Then }) => {
			Given('a StaffRole aggregate with system account permission', () => {
				passport = makePassport(false, true);
				staffRole = new StaffRole(makeBaseProps(), passport);
			});
			When('I set isDefault to true', () => {
				staffRole.isDefault = true;
			});
			Then("the staff role's isDefault should be true", () => {
				expect(staffRole.isDefault).toBe(true);
			});
		},
	);

	Scenario('Changing isDefault without permission', ({ Given, When, Then }) => {
		let changingIsDefaultWithoutPermission: () => void;
		Given(
			'a StaffRole aggregate without permission to manage staff roles and permissions or system account',
			() => {
				passport = makePassport(false, false);
				staffRole = new StaffRole(makeBaseProps(), passport);
			},
		);
		When('I try to set isDefault to true', () => {
			changingIsDefaultWithoutPermission = () => {
				staffRole.isDefault = true;
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(changingIsDefaultWithoutPermission).toThrow(PermissionError);
			expect(changingIsDefaultWithoutPermission).throws(
				'You do not have permission to update this role',
			);
		});
	});

	// deleteAndReassignTo
	Scenario(
		'Deleting a non-default staff role with permission',
		({ Given, When, Then, And }) => {
			let deletedRole: StaffRole<StaffRoleProps>;
			Given(
				'a StaffRole aggregate that is not deleted and is not default, with permission to manage staff roles and permissions',
				() => {
					passport = makePassport(true, false);
					deletedRole = new StaffRole(
						makeBaseProps({ isDefault: false }),
						passport,
					);
				},
			);
			When(
				'I call deleteAndReassignTo with a valid StaffRoleEntityReference',
				() => {
					deletedRole.deleteAndReassignTo({
						id: 'role-2',
					// biome-ignore lint/plugin/no-type-assertion: test file
					} as StaffRoleEntityReference);
				},
			);
			Then('the staff role should be marked as deleted', () => {
				expect(deletedRole.isDeleted).toBe(true);
			});
			And(
				'a RoleDeletedReassignEvent should be added to integration events',
				() => {
					const event = getIntegrationEvent(
						deletedRole.getIntegrationEvents(),
						RoleDeletedReassignEvent,
					);
					expect(event).toBeDefined();
					expect(event).toBeInstanceOf(RoleDeletedReassignEvent);
					expect(event?.payload.deletedRoleId).toBe('role-1');
					expect(event?.payload.newRoleId).toBe('role-2');
				},
			);
		},
	);

	Scenario(
		'Deleting a non-default staff role without permission',
		({ Given, When, Then, And }) => {
			let deletedRole: StaffRole<StaffRoleProps>;
			let deletingRoleWithoutPermission: () => void;
			Given(
				'a StaffRole aggregate that is not deleted and is not default, without permission to manage staff roles and permissions',
				() => {
					passport = makePassport(false, false);
					deletedRole = new StaffRole(
						makeBaseProps({ isDefault: false }),
						passport,
					);
				},
			);
			When(
				'I try to call deleteAndReassignTo with a valid StaffRoleEntityReference',
				() => {
					deletingRoleWithoutPermission = () => {
						deletedRole.deleteAndReassignTo({
							id: 'role-2',
						// biome-ignore lint/plugin/no-type-assertion: test file
						} as StaffRoleEntityReference);
					};
				},
			);
			Then('a PermissionError should be thrown', () => {
				expect(deletingRoleWithoutPermission).toThrow(PermissionError);
				expect(deletingRoleWithoutPermission).toThrow(
					'You do not have permission to delete this role',
				);
			});
			And('no RoleDeletedReassignEvent should be emitted', () => {
				const event = getIntegrationEvent(
					deletedRole.getIntegrationEvents(),
					RoleDeletedReassignEvent,
				);
				expect(event).toBeUndefined();
			});
		},
	);

	Scenario('Deleting a default staff role', ({ Given, When, Then, And }) => {
		let defaultRole: StaffRole<StaffRoleProps>;
		let deletingDefaultRole: () => void;
		Given('a StaffRole aggregate that is default', () => {
			passport = makePassport(true, false);
			defaultRole = new StaffRole(makeBaseProps({ isDefault: true }), passport);
		});
		When(
			'I try to call deleteAndReassignTo with a valid StaffRoleEntityReference',
			() => {
				deletingDefaultRole = () => {
					defaultRole.deleteAndReassignTo({
						id: 'role-2',
					// biome-ignore lint/plugin/no-type-assertion: test file
					} as StaffRoleEntityReference);
				};
			},
		);
		Then('a PermissionError should be thrown', () => {
			expect(deletingDefaultRole).toThrow(PermissionError);
		});
		And('no RoleDeletedReassignEvent should be emitted', () => {
			const event = getIntegrationEvent(
				defaultRole.getIntegrationEvents(),
				RoleDeletedReassignEvent,
			);
			expect(event).toBeUndefined();
		});
	});

	// permissions (delegation)
	Scenario('Accessing permissions entity', ({ Given, When, Then }) => {
		let permissions: StaffRolePermissions;
		Given('a StaffRole aggregate', () => {
			passport = makePassport(true, false);
			staffRole = new StaffRole(makeBaseProps(), passport);
		});
		When('I access the permissions property', () => {
			permissions = staffRole.permissions;
		});
		Then('I should receive a StaffRolePermissions entity instance', () => {
			expect(permissions).toBeInstanceOf(StaffRolePermissions);
		});
	});

	// read-only properties
	Scenario(
		'Getting roleType, createdAt, updatedAt, and schemaVersion',
		({ Given, Then, And }) => {
			Given('a StaffRole aggregate', () => {
				passport = makePassport(true, false);
				staffRole = new StaffRole(makeBaseProps(), passport);
			});
			Then('the roleType property should return the correct value', () => {
				expect(staffRole.roleType).toBe('staff-role');
			});
			And('the createdAt property should return the correct date', () => {
				expect(staffRole.createdAt).toEqual(new Date('2020-01-01T00:00:00Z'));
			});
			And('the updatedAt property should return the correct date', () => {
				expect(staffRole.updatedAt).toEqual(new Date('2020-01-02T00:00:00Z'));
			});
			And(
				'the schemaVersion property should return the correct version',
				() => {
					expect(staffRole.schemaVersion).toBe('1.0.0');
				},
			);
		},
	);
});
