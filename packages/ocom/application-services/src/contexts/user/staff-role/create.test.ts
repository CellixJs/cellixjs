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
	};
	return {
		id: `id-${roleName}`,
		roleName,
		enterpriseAppRole: '',
		isDefault: false,
		roleType: null,
		permissions: { communityPermissions, userPermissions },
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
		getByRoleName: unexpectedError
			? vi.fn().mockRejectedValue(unexpectedError)
			: existingRole
				? vi.fn().mockResolvedValue(existingRole)
				: vi.fn().mockRejectedValue(new Error('not found')),
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
});
