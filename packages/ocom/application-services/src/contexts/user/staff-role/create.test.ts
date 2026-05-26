import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { expect, vi } from 'vitest';
import { create, type StaffRoleCreateCommand, type StaffRoleCreateCommandPermissions } from './create.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/create.feature'));

// ─── Helpers ─────────────────────────────────────────────────────────────────

type MockPermissions = {
	communityPermissions: Record<string, boolean>;
	userPermissions: Record<string, boolean>;
	staffRolePermissions?: Record<string, boolean>;
	financePermissions?: Record<string, boolean>;
	techAdminPermissions?: Record<string, boolean>;
	propertyPermissions?: Record<string, boolean>;
	servicePermissions?: Record<string, boolean>;
	serviceTicketPermissions?: Record<string, boolean>;
	violationTicketPermissions?: Record<string, boolean>;
};

interface MockStaffRoleInstance {
	id: string;
	roleName: string;
	enterpriseAppRole: string;
	isDefault: boolean;
	roleType: null;
	permissions: MockPermissions;
	createdAt: Date;
	updatedAt: Date;
	schemaVersion: string;
}

function makeMockStaffRoleInstance(roleName: string): MockStaffRoleInstance {
	const communityPermissions: Record<string, boolean> = {
		canManageCommunities: false,
		canManageStaffRolesAndPermissions: false,
		canManageAllCommunities: false,
		canDeleteCommunities: false,
		canChangeCommunityOwner: false,
		canReIndexSearchCollections: false,
	};
	const userPermissions: Record<string, boolean> = {
		canManageUsers: false,
		canAssignStaffUserRoles: false,
		canAssignStaffRoles: false,
		canViewStaffUsers: false,
	};
	const staffRolePermissions: Record<string, boolean> = {
		canViewRoles: false,
		canAddRole: false,
		canEditRole: false,
		canRemoveRole: false,
	};
	const financePermissions: Record<string, boolean> = {
		canManageFinance: false,
		canViewGLBatchSummaries: false,
		canViewFinanceConfigs: false,
		canCreateFinanceConfigs: false,
	};
	const techAdminPermissions: Record<string, boolean> = {
		canManageTechAdmin: false,
		canViewDatabaseDocuments: false,
		canViewBlobExplorer: false,
		canViewQueueDashboard: false,
		canSendQueueMessages: false,
	};
	const propertyPermissions: Record<string, boolean> = {
		canManageProperties: false,
		canEditOwnProperty: false,
	};
	const servicePermissions: Record<string, boolean> = {
		canManageServices: false,
	};
	const serviceTicketPermissions: Record<string, boolean> = {
		canCreateTickets: false,
		canManageTickets: false,
		canAssignTickets: false,
		canWorkOnTickets: false,
	};
	const violationTicketPermissions: Record<string, boolean> = {
		canCreateTickets: false,
		canManageTickets: false,
		canAssignTickets: false,
		canWorkOnTickets: false,
	};

	return {
		id: `id-${roleName}`,
		roleName,
		enterpriseAppRole: '',
		isDefault: false,
		roleType: null,
		permissions: {
			communityPermissions,
			userPermissions,
			staffRolePermissions,
			financePermissions,
			techAdminPermissions,
			propertyPermissions,
			servicePermissions,
			serviceTicketPermissions,
			violationTicketPermissions,
		},
		createdAt: new Date(),
		updatedAt: new Date(),
		schemaVersion: '1.0',
	} as unknown as MockStaffRoleInstance;
}

function makeDataSources(overrides: {
	existingRole?: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null;
	unexpectedError?: Error;
	newRoleInstance?: MockStaffRoleInstance;
	explicitUndefinedSave?: boolean;
}): DataSources & { _repo: unknown } {
	const { existingRole, unexpectedError, newRoleInstance, explicitUndefinedSave } = overrides;
	const instance = newRoleInstance ?? makeMockStaffRoleInstance('Test Role');
	const savedRole = explicitUndefinedSave ? undefined : (instance as unknown as Domain.Contexts.User.StaffRole.StaffRoleEntityReference);

	const repo = {
		getByRoleName: unexpectedError ? vi.fn().mockRejectedValue(unexpectedError) : existingRole ? vi.fn().mockResolvedValue(existingRole) : vi.fn().mockRejectedValue(new Error('not found')),
		getNewInstance: vi.fn().mockResolvedValue(instance),
		save: vi.fn().mockResolvedValue(savedRole),
	} as unknown as Domain.Contexts.User.StaffRole.StaffRoleRepository<Domain.Contexts.User.StaffRole.StaffRoleProps>;

	return {
		domainDataSource: {
			User: {
				StaffRole: {
					StaffRoleUnitOfWork: {
						withScopedTransaction: vi.fn().mockImplementation(async (cb: (r: typeof repo) => Promise<void>) => {
							await cb(repo);
						}),
					},
				},
			},
		},
		_repo: repo,
	} as unknown as DataSources & { _repo: unknown };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let dataSources: DataSources & { _repo?: unknown };
	let command: StaffRoleCreateCommand;
	let result: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | undefined;
	let thrownError: unknown;
	let roleInstance: MockStaffRoleInstance;

	BeforeEachScenario(() => {
		result = undefined;
		thrownError = undefined;
		roleInstance = makeMockStaffRoleInstance('Test Role');
		command = { roleName: 'Test Role' };
	});

	// ─── Create with no permissions ───────────────────────────────────────────

	Scenario('Successfully creates a staff role with no permissions', ({ Given, When, Then, And }) => {
		Given('a staff role with name "Test Role" does not exist in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('Test Role');
			dataSources = makeDataSources({ newRoleInstance: roleInstance });
			command = { roleName: 'Test Role' };
		});

		When('I call create with roleName "Test Role" and no permissions', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('the new staff role should be saved', () => {
			const repo = dataSources._repo as { save: ReturnType<typeof vi.fn> };
			expect(repo.save).toHaveBeenCalled();
		});

		And('the result should have roleName "Test Role"', () => {
			expect(thrownError).toBeUndefined();
			expect(result).toBeDefined();
			expect(result?.roleName).toBe('Test Role');
		});
	});

	// ─── Create with enterpriseAppRole ────────────────────────────────────────

	Scenario('Successfully creates a staff role with an enterpriseAppRole', ({ Given, When, Then }) => {
		Given('a staff role with name "Test Role" does not exist in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('Test Role');
			dataSources = makeDataSources({ newRoleInstance: roleInstance });
			command = { roleName: 'Test Role', enterpriseAppRole: 'Staff.TestRole' };
		});

		When('I call create with roleName "Test Role" and enterpriseAppRole "Staff.TestRole"', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('the new staff role should be saved with enterpriseAppRole "Staff.TestRole"', () => {
			expect(thrownError).toBeUndefined();
			expect(roleInstance.enterpriseAppRole).toBe('Staff.TestRole');
		});
	});

	// ─── Create with community permissions ───────────────────────────────────

	Scenario('Successfully creates a staff role with community permissions', ({ Given, When, Then, And }) => {
		Given('a staff role with name "Admin Role" does not exist in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('Admin Role');
			dataSources = makeDataSources({ newRoleInstance: roleInstance });
			command = {
				roleName: 'Admin Role',
				permissions: { community: { canManageCommunities: true } } satisfies StaffRoleCreateCommandPermissions,
			};
		});

		When('I call create with roleName "Admin Role" and community permissions canManageCommunities true', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('the new staff role should be saved', () => {
			const repo = dataSources._repo as { save: ReturnType<typeof vi.fn> };
			expect(repo.save).toHaveBeenCalled();
		});

		And('the community permission canManageCommunities should be true', () => {
			expect(thrownError).toBeUndefined();
			expect(roleInstance.permissions.communityPermissions['canManageCommunities']).toBe(true);
		});
	});

	// ─── Create with user permissions ────────────────────────────────────────

	Scenario('Successfully creates a staff role with user permissions', ({ Given, When, Then, And }) => {
		Given('a staff role with name "Manager Role" does not exist in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('Manager Role');
			dataSources = makeDataSources({ newRoleInstance: roleInstance });
			command = {
				roleName: 'Manager Role',
				permissions: { user: { canManageUsers: true } } satisfies StaffRoleCreateCommandPermissions,
			};
		});

		When('I call create with roleName "Manager Role" and user permissions canManageUsers true', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('the new staff role should be saved', () => {
			const repo = dataSources._repo as { save: ReturnType<typeof vi.fn> };
			expect(repo.save).toHaveBeenCalled();
		});

		And('the user permission canManageUsers should be true', () => {
			expect(thrownError).toBeUndefined();
			expect(roleInstance.permissions.userPermissions['canManageUsers']).toBe(true);
		});
	});

	// ─── Duplicate name ───────────────────────────────────────────────────────

	Scenario('Throws when a staff role with the same name already exists', ({ Given, When, Then }) => {
		Given('a staff role with name "Duplicate Role" already exists in the repository', () => {
			const existing = makeMockStaffRoleInstance('Duplicate Role') as unknown as Domain.Contexts.User.StaffRole.StaffRoleEntityReference;
			dataSources = makeDataSources({ existingRole: existing });
			command = { roleName: 'Duplicate Role' };
		});

		When('I call create with roleName "Duplicate Role"', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('it should throw an error with message containing "Duplicate Role"', () => {
			expect(thrownError).toBeDefined();
			expect((thrownError as Error).message).toContain('Duplicate Role');
		});
	});

	// ─── Unexpected repository error propagation ──────────────────────────────

	Scenario('Propagates unexpected repository errors from getByRoleName', ({ Given, When, Then }) => {
		Given('the repository throws an unexpected error when checking for "Error Role"', () => {
			const unexpectedError = new Error('Database connection lost');
			dataSources = makeDataSources({ unexpectedError });
			command = { roleName: 'Error Role' };
		});

		When('I call create with roleName "Error Role"', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('it should throw the unexpected error', () => {
			expect(thrownError).toBeDefined();
			expect((thrownError as Error).message).toBe('Database connection lost');
		});
	});

	// ─── Save fails ───────────────────────────────────────────────────────────

	Scenario('Throws when repository fails to save the new role', ({ Given, When, Then, And }) => {
		Given('a staff role with name "Test Role" does not exist in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('Test Role');
		});

		And('saving the staff role returns undefined', () => {
			dataSources = makeDataSources({ newRoleInstance: roleInstance, explicitUndefinedSave: true });
			command = { roleName: 'Test Role' };
		});

		When('I call create with roleName "Test Role" and no permissions', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('it should throw an error with message "Unable to create staff role"', () => {
			expect(thrownError).toBeDefined();
			expect((thrownError as Error).message).toBe('Unable to create staff role');
		});
	});

	// ─── enterpriseAppRole default ────────────────────────────────────────────

	Scenario('enterpriseAppRole is not set when not provided in the command', ({ Given, When, Then }) => {
		Given('a staff role with name "Test Role" does not exist in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('Test Role');
			dataSources = makeDataSources({ newRoleInstance: roleInstance });
			command = { roleName: 'Test Role' };
		});
		When('I call create with roleName "Test Role" and no permissions', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});
		Then('the enterpriseAppRole on the saved instance should remain empty', () => {
			expect(thrownError).toBeUndefined();
			expect(roleInstance.enterpriseAppRole).toBe('');
		});
	});

	// ─── NotFoundError by name ────────────────────────────────────────────────

	Scenario('Not-found detected via error name NotFoundError allows creation to proceed', ({ Given, When, Then }) => {
		Given('the repository raises a NotFoundError by name when checking for "New Role"', () => {
			roleInstance = makeMockStaffRoleInstance('New Role');
			const notFoundByName = Object.assign(new Error('some message'), { name: 'NotFoundError' });
			const repo = {
				getByRoleName: vi.fn().mockRejectedValue(notFoundByName),
				getNewInstance: vi.fn().mockResolvedValue(roleInstance),
				save: vi.fn().mockResolvedValue(roleInstance as unknown as Domain.Contexts.User.StaffRole.StaffRoleEntityReference),
			};
			dataSources = {
				domainDataSource: {
					User: {
						StaffRole: {
							StaffRoleUnitOfWork: {
								withScopedTransaction: vi.fn().mockImplementation(async (cb: (r: typeof repo) => Promise<void>) => {
									await cb(repo);
								}),
							},
						},
					},
				},
				_repo: repo,
			} as unknown as DataSources & { _repo: unknown };
			command = { roleName: 'New Role' };
		});
		When('I call create with roleName "New Role" and no permissions', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});
		Then('the new staff role should be saved', () => {
			expect(thrownError).toBeUndefined();
			expect(result).toBeDefined();
		});
	});

	// ─── All community permissions ────────────────────────────────────────────

	Scenario('Successfully creates a staff role with all community permissions set', ({ Given, When, Then }) => {
		Given('a staff role with name "Full Community Role" does not exist in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('Full Community Role');
			dataSources = makeDataSources({ newRoleInstance: roleInstance });
			command = {
				roleName: 'Full Community Role',
				permissions: {
					community: {
						canManageCommunities: true,
						canManageStaffRolesAndPermissions: true,
						canManageAllCommunities: true,
						canDeleteCommunities: true,
						canChangeCommunityOwner: true,
						canReIndexSearchCollections: true,
					},
				},
			};
		});
		When('I call create with roleName "Full Community Role" and all community permissions true', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});
		Then('all community permissions should be true on the saved instance', () => {
			expect(thrownError).toBeUndefined();
			const cp = roleInstance.permissions.communityPermissions;
			expect(cp['canManageCommunities']).toBe(true);
			expect(cp['canManageStaffRolesAndPermissions']).toBe(true);
			expect(cp['canManageAllCommunities']).toBe(true);
			expect(cp['canDeleteCommunities']).toBe(true);
			expect(cp['canChangeCommunityOwner']).toBe(true);
			expect(cp['canReIndexSearchCollections']).toBe(true);
		});
	});

	// ─── canAssignStaffUserRoles ──────────────────────────────────────────────

	Scenario('Successfully creates a staff role with canAssignStaffUserRoles set', ({ Given, When, Then }) => {
		Given('a staff role with name "Assign Role" does not exist in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('Assign Role');
			dataSources = makeDataSources({ newRoleInstance: roleInstance });
			command = {
				roleName: 'Assign Role',
				permissions: { user: { canAssignStaffUserRoles: true } } satisfies StaffRoleCreateCommandPermissions,
			};
		});
		When('I call create with roleName "Assign Role" and user permissions canAssignStaffUserRoles true', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});
		Then('the user permission canAssignStaffUserRoles should be true', () => {
			expect(thrownError).toBeUndefined();
			expect(roleInstance.permissions.userPermissions['canAssignStaffUserRoles']).toBe(true);
		});
	});

	// ─── No-op when sub-objects absent ───────────────────────────────────────

	Scenario('Omitting community permissions sub-object leaves community permissions unchanged', ({ Given, When, Then }) => {
		Given('a staff role with name "Test Role" does not exist in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('Test Role');
			dataSources = makeDataSources({ newRoleInstance: roleInstance });
			command = {
				roleName: 'Test Role',
				permissions: { user: { canManageUsers: true } },
			};
		});
		When('I call create with roleName "Test Role" and only user permissions', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});
		Then('all community permissions should remain false', () => {
			expect(thrownError).toBeUndefined();
			const cp = roleInstance.permissions.communityPermissions;
			for (const key of Object.keys(cp)) {
				expect(cp[key], key).toBe(false);
			}
		});
	});

	Scenario('Omitting user permissions sub-object leaves user permissions unchanged', ({ Given, When, Then }) => {
		Given('a staff role with name "Test Role" does not exist in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('Test Role');
			dataSources = makeDataSources({ newRoleInstance: roleInstance });
			command = {
				roleName: 'Test Role',
				permissions: { community: { canManageCommunities: true } },
			};
		});
		When('I call create with roleName "Test Role" and only community permissions', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});
		Then('all user permissions should remain false', () => {
			expect(thrownError).toBeUndefined();
			const up = roleInstance.permissions.userPermissions;
			for (const key of Object.keys(up)) {
				expect(up[key], key).toBe(false);
			}
		});
	});

	// ─── getNewInstance called with roleName ──────────────────────────────────

	Scenario('getNewInstance is called with the provided role name', ({ Given, When, Then }) => {
		Given('a staff role with name "Named Role" does not exist in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('Named Role');
			dataSources = makeDataSources({ newRoleInstance: roleInstance });
			command = { roleName: 'Named Role' };
		});
		When('I call create with roleName "Named Role" and no permissions', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});
		Then('getNewInstance should have been called with "Named Role"', () => {
			expect(thrownError).toBeUndefined();
			const repo = dataSources._repo as { getNewInstance: ReturnType<typeof vi.fn> };
			expect(repo.getNewInstance).toHaveBeenCalledWith('Named Role');
		});
	});

	// ─── Additional permission scenarios added ───────────────────────────────

	Scenario('Successfully creates a staff role with staff-role permissions', ({ Given, When, Then }) => {
		Given('a staff role with name "Role Manager" does not exist in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('Role Manager');
			dataSources = makeDataSources({ newRoleInstance: roleInstance });
			command = {
				roleName: 'Role Manager',
				permissions: { staffRole: { canViewRoles: true, canAddRole: true, canEditRole: true, canRemoveRole: true } },
			};
		});
		When('I call create with roleName "Role Manager" and staffRole permissions canViewRoles true, canAddRole true, canEditRole true, canRemoveRole true', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});
		Then('the staffRole permissions should be set on the saved instance', () => {
			expect(thrownError).toBeUndefined();
			const sp = roleInstance.permissions.staffRolePermissions;
			expect(sp).toBeDefined();
			// The create pipeline applies into staffRolePermissions adapter; check known keys
			expect(sp?.['canViewRoles']).toBe(true);
			expect(sp?.['canAddRole']).toBe(true);
			expect(sp?.['canEditRole']).toBe(true);
			expect(sp?.['canRemoveRole']).toBe(true);
		});
	});

	Scenario('Successfully creates a staff role with finance permissions', ({ Given, When, Then }) => {
		Given('a staff role with name "Finance Role" does not exist in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('Finance Role');
			dataSources = makeDataSources({ newRoleInstance: roleInstance });
			command = { roleName: 'Finance Role', permissions: { finance: { canManageFinance: true } } };
		});
		When('I call create with roleName "Finance Role" and finance permissions canManageFinance true', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});
		Then('the finance permission canManageFinance should be true on the saved instance', () => {
			expect(thrownError).toBeUndefined();
			const fp = roleInstance.permissions.financePermissions;
			expect(fp).toBeDefined();
			expect(fp?.['canManageFinance']).toBe(true);
		});
	});

	Scenario('Successfully creates a staff role with tech-admin permissions', ({ Given, When, Then }) => {
		Given('a staff role with name "Tech Role" does not exist in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('Tech Role');
			dataSources = makeDataSources({ newRoleInstance: roleInstance });
			command = { roleName: 'Tech Role', permissions: { techAdmin: { canManageTechAdmin: true } } };
		});
		When('I call create with roleName "Tech Role" and techAdmin permissions canManageTechAdmin true', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});
		Then('the techAdmin permission canManageTechAdmin should be true on the saved instance', () => {
			expect(thrownError).toBeUndefined();
			const tp = roleInstance.permissions.techAdminPermissions;
			expect(tp).toBeDefined();
			expect(tp?.['canManageTechAdmin']).toBe(true);
		});
	});

	Scenario('Creating role with canAssignStaffRoles true updates both assign flags', ({ Given, When, Then }) => {
		Given('a staff role with name "AssignBoth Role" does not exist in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('AssignBoth Role');
			dataSources = makeDataSources({ newRoleInstance: roleInstance });
			command = { roleName: 'AssignBoth Role', permissions: { user: { canAssignStaffRoles: true } } };
		});
		When('I call create with roleName "AssignBoth Role" and user permissions canAssignStaffRoles true', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});
		Then('both user permission flags for assigning staff roles should be true', () => {
			expect(thrownError).toBeUndefined();
			expect(roleInstance.permissions.userPermissions['canAssignStaffRoles']).toBe(true);
			expect(roleInstance.permissions.userPermissions['canAssignStaffUserRoles']).toBe(true);
		});
	});
});
