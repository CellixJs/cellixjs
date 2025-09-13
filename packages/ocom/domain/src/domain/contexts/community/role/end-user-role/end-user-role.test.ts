import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';

import { EndUserRole, type EndUserRoleProps } from './end-user-role.ts';
import { RoleDeletedReassignEvent } from '../../../../events/types/role-deleted-reassign.ts';
import { DomainSeedwork } from '@cellix/domain-seedwork';
import type { Passport } from '../../../passport.ts';
import type { CommunityDomainPermissions } from '../../community.domain-permissions.ts';
import type { CommunityProps } from '../../community/community.ts';
import { EndUserRolePermissions } from './end-user-role-permissions.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/end-user-role.feature'),
);

function makeCommunityProps(id = 'community-1') {
	return {
		id,
		name: 'Test Community',
		// ...other required fields
	} as CommunityProps;
}

function makePassport(overrides: Partial<CommunityDomainPermissions> = {}) {
	return vi.mocked({
		community: {
			forCommunity: vi.fn(() => ({
				determineIf: (
					fn: (p: {
						canManageEndUserRolesAndPermissions: boolean;
						isSystemAccount: boolean;
					}) => boolean,
				) =>
					fn({
						canManageEndUserRolesAndPermissions:
							overrides.canManageEndUserRolesAndPermissions ?? true,
						isSystemAccount: overrides.isSystemAccount ?? false,
					}),
			})),
		},
	} as unknown as Passport);
}

function makeBaseProps(
	overrides: Partial<EndUserRoleProps> = {},
): EndUserRoleProps {
	return {
		id: 'role-1',
		roleName: 'Member',
		isDefault: false,
		community: makeCommunityProps(),
		permissions: {
			communityPermissions: {},
			propertyPermissions: {},
			serviceTicketPermissions: {},
			servicePermissions: {},
			violationTicketPermissions: {},
		} as EndUserRolePermissions,
		roleType: 'end-user-role',
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
	return events.find((e) => e instanceof eventClass) as T | undefined;
}

describeFeature(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let passport: ReturnType<typeof makePassport>;
	let baseProps: ReturnType<typeof makeBaseProps>;
	let communityRef: ReturnType<typeof makeCommunityProps>;
	let role: EndUserRole<EndUserRoleProps>;
	let newRole: EndUserRole<EndUserRoleProps>;

	BeforeEachScenario(() => {
		passport = makePassport();
		communityRef = makeCommunityProps();
		baseProps = makeBaseProps();
		role = new EndUserRole(baseProps, passport);
		newRole = undefined as unknown as EndUserRole<EndUserRoleProps>;
	});

	Background(({ Given, And }) => {
		Given('a valid Passport with community permissions', () => {
			passport = makePassport({ canManageEndUserRolesAndPermissions: true });
		});
		And('a valid CommunityEntityReference', () => {
			communityRef = makeCommunityProps();
		});
		And(
			'base end user role properties with roleName "Member", isDefault false, and valid timestamps',
			() => {
				baseProps = makeBaseProps();
				role = new EndUserRole(baseProps, passport);
			},
		);
	});

	Scenario('Creating a new end user role instance', ({ When, Then, And }) => {
		When(
			'I create a new EndUserRole aggregate using getNewInstance with roleName "Member", isDefault false, and a CommunityEntityReference',
			() => {
				newRole = EndUserRole.getNewInstance(
					makeBaseProps(),
					passport,
					'Member',
					false,
					communityRef,
				);
			},
		);
		Then('the role\'s roleName should be "Member"', () => {
			expect(newRole.roleName).toBe('Member');
		});
		And("the role's isDefault should be false", () => {
			expect(newRole.isDefault).toBe(false);
		});
		And(
			"the role's community should reference the provided CommunityEntityReference",
			() => {
				expect(newRole.community.id).toBe(communityRef.id);
			},
		);
	});

	Scenario(
		'Changing the roleName with permission to manage end user roles',
		({ Given, When, Then }) => {
			Given(
				'an EndUserRole aggregate with permission to manage end user roles',
				() => {
					passport = makePassport({
						canManageEndUserRolesAndPermissions: true,
					});
					role = new EndUserRole(makeBaseProps(), passport);
				},
			);
			When('I set the roleName to "VIP"', () => {
				role.roleName = 'VIP';
			});
			Then('the role\'s roleName should be "VIP"', () => {
				expect(role.roleName).toBe('VIP');
			});
		},
	);

	Scenario(
		'Changing the roleName without permission',
		({ Given, When, Then }) => {
			let changeRoleName: () => void;
			Given(
				'an EndUserRole aggregate without permission to manage end user roles',
				() => {
					passport = makePassport({
						canManageEndUserRolesAndPermissions: false,
					});
					role = new EndUserRole(makeBaseProps(), passport);
				},
			);
			When('I try to set the roleName to "VIP"', () => {
				changeRoleName = () => {
					role.roleName = 'VIP';
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(changeRoleName).toThrow(DomainSeedwork.PermissionError);
				expect(changeRoleName).toThrow('Cannot set role name');
			});
		},
	);

	Scenario(
		'Changing the roleName to an invalid value',
		({ Given, When, Then }) => {
			let changeRoleNameToInvalid: () => void;
			Given(
				'an EndUserRole aggregate with permission to manage end user roles',
				() => {
					passport = makePassport({
						canManageEndUserRolesAndPermissions: true,
					});
					role = new EndUserRole(makeBaseProps(), passport);
				},
			);
			When(
				'I try to set the roleName to an invalid value (e.g., null or empty string)',
				() => {
					changeRoleNameToInvalid = () => {
						role.roleName = '';
					};
				},
			);
			Then('an error should be thrown indicating the value is invalid', () => {
				expect(changeRoleNameToInvalid).throws('Too short');
			});
		},
	);

	Scenario(
		'Changing isDefault with permission to manage end user roles',
		({ Given, When, Then }) => {
			Given(
				'an EndUserRole aggregate with permission to manage end user roles',
				() => {
					passport = makePassport({
						canManageEndUserRolesAndPermissions: true,
					});
					role = new EndUserRole(makeBaseProps(), passport);
				},
			);
			When('I set isDefault to true', () => {
				role.isDefault = true;
			});
			Then("the role's isDefault should be true", () => {
				expect(role.isDefault).toBe(true);
			});
		},
	);

	Scenario(
		'Changing isDefault with system account permission',
		({ Given, When, Then }) => {
			Given('an EndUserRole aggregate with system account permission', () => {
				passport = makePassport({
					canManageEndUserRolesAndPermissions: false,
					isSystemAccount: true,
				});
				role = new EndUserRole(makeBaseProps(), passport);
			});
			When('I set isDefault to true', () => {
				role.isDefault = true;
			});
			Then("the role's isDefault should be true", () => {
				expect(role.isDefault).toBe(true);
			});
		},
	);

	Scenario('Changing isDefault without permission', ({ Given, When, Then }) => {
		let changeIsDefault: () => void;
		Given(
			'an EndUserRole aggregate without permission to manage end user roles or system account',
			() => {
				passport = makePassport({
					canManageEndUserRolesAndPermissions: false,
					isSystemAccount: false,
				});
				role = new EndUserRole(makeBaseProps(), passport);
			},
		);
		When('I try to set isDefault to true', () => {
			changeIsDefault = () => {
				role.isDefault = true;
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(changeIsDefault).toThrow(DomainSeedwork.PermissionError);
			expect(changeIsDefault).toThrow(
				'You do not have permission to update this role',
			);
		});
	});

	Scenario(
		'Deleting a non-default end user role with permission to manage end user roles',
		({ Given, When, Then, And }) => {
			let reassignedRole: EndUserRole<EndUserRoleProps>;
			Given(
				'an EndUserRole aggregate that is not deleted and is not default, with permission to manage end user roles',
				() => {
					passport = makePassport({
						canManageEndUserRolesAndPermissions: true,
					});
					role = new EndUserRole(makeBaseProps({ isDefault: false }), passport);
					reassignedRole = new EndUserRole(
						makeBaseProps({ id: 'role-2' }),
						passport,
					);
				},
			);
			When(
				'I call deleteAndReassignTo with a valid EndUserRoleEntityReference',
				() => {
					role.deleteAndReassignTo(reassignedRole);
				},
			);
			Then('the role should be marked as deleted', () => {
				expect(role.isDeleted).toBe(true);
			});
			And(
				'a RoleDeletedReassignEvent should be added to integration events',
				() => {
					const event = getIntegrationEvent(
						role.getIntegrationEvents(),
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
		'Deleting a non-default end user role without permission',
		({ Given, When, Then, And }) => {
			let reassignedRole: EndUserRole<EndUserRoleProps>;
			let deleteWithoutPermission: () => void;
			Given(
				'an EndUserRole aggregate that is not deleted and is not default, without permission to manage end user roles',
				() => {
					passport = makePassport({
						canManageEndUserRolesAndPermissions: false,
					});
					role = new EndUserRole(makeBaseProps({ isDefault: false }), passport);
					reassignedRole = new EndUserRole(
						makeBaseProps({ id: 'role-2' }),
						passport,
					);
				},
			);
			When(
				'I try to call deleteAndReassignTo with a valid EndUserRoleEntityReference',
				() => {
					deleteWithoutPermission = () => {
						role.deleteAndReassignTo(reassignedRole);
					};
				},
			);
			Then('a PermissionError should be thrown', () => {
				expect(deleteWithoutPermission).toThrow(DomainSeedwork.PermissionError);
				expect(deleteWithoutPermission).toThrow(
					'You do not have permission to delete this role',
				);
			});
			And('no RoleDeletedReassignEvent should be emitted', () => {
				expect(
					getIntegrationEvent(
						role.getIntegrationEvents(),
						RoleDeletedReassignEvent,
					),
				).toBeUndefined();
			});
		},
	);

	Scenario('Deleting a default end user role', ({ Given, When, Then, And }) => {
		let reassignedRole: EndUserRole<EndUserRoleProps>;
		let deleteDefault: () => void;
		Given('an EndUserRole aggregate that is default', () => {
			passport = makePassport({ canManageEndUserRolesAndPermissions: true });
			role = new EndUserRole(makeBaseProps({ isDefault: true }), passport);
			reassignedRole = new EndUserRole(
				makeBaseProps({ id: 'role-2' }),
				passport,
			);
		});
		When(
			'I try to call deleteAndReassignTo with a valid EndUserRoleEntityReference',
			() => {
				deleteDefault = () => {
					role.deleteAndReassignTo(reassignedRole);
				};
			},
		);
		Then('a PermissionError should be thrown', () => {
			expect(deleteDefault).toThrow(DomainSeedwork.PermissionError);
			expect(deleteDefault).toThrow(
				'You cannot delete a default end user role',
			);
		});
		And('no RoleDeletedReassignEvent should be emitted', () => {
			expect(
				getIntegrationEvent(
					role.getIntegrationEvents(),
					RoleDeletedReassignEvent,
				),
			).toBeUndefined();
		});
	});

	Scenario('Accessing permissions entity', ({ Given, When, Then }) => {
		let permissions: EndUserRolePermissions;
		Given('an EndUserRole aggregate', () => {
			passport = makePassport();
			role = new EndUserRole(makeBaseProps(), passport);
		});
		When('I access the permissions property', () => {
			permissions = role.permissions;
		});
		Then('I should receive an EndUserRolePermissions entity instance', () => {
			expect(permissions).toBeInstanceOf(EndUserRolePermissions);
			expect(permissions).toEqual({
				props: {
					communityPermissions: expect.anything(),
					propertyPermissions: expect.anything(),
					serviceTicketPermissions: expect.anything(),
					servicePermissions: expect.anything(),
					violationTicketPermissions: expect.anything(),
				},
				visa: { determineIf: expect.any(Function) },
			});
		});
	});

	Scenario(
		'Getting roleType, createdAt, updatedAt, and schemaVersion',
		({ Given, Then, And }) => {
			Given('an EndUserRole aggregate', () => {
				passport = makePassport();
				baseProps = makeBaseProps();
				role = new EndUserRole(baseProps, passport);
			});
			Then('the roleType property should return the correct value', () => {
				expect(role.roleType).toBe('end-user-role');
			});
			And('the createdAt property should return the correct date', () => {
				expect(role.createdAt).toEqual(new Date('2020-01-01T00:00:00Z'));
			});
			And('the updatedAt property should return the correct date', () => {
				expect(role.updatedAt).toEqual(new Date('2020-01-02T00:00:00Z'));
			});
			And(
				'the schemaVersion property should return the correct version',
				() => {
					expect(role.schemaVersion).toBe('1.0.0');
				},
			);
		},
	);
});
