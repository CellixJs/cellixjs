import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { expect, vi } from 'vitest';
import { type StaffRoleUpdateCommand, update } from './update.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/update.feature'));

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

function makeMockStaffRoleInstance(id: string, roleName = 'Original Role'): MockStaffRoleInstance {
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
		id,
		roleName,
		enterpriseAppRole: 'Original.AppRole',
		isDefault: false,
		roleType: null,
		permissions: { communityPermissions, userPermissions },
		createdAt: new Date(),
		updatedAt: new Date(),
		schemaVersion: '1.0',
	};
}

function makeDataSources(overrides: { roleInstance?: MockStaffRoleInstance; explicitUndefinedSave?: boolean }): DataSources & { _repo: unknown } {
	const { roleInstance, explicitUndefinedSave } = overrides;
	const instance = roleInstance ?? makeMockStaffRoleInstance('role-001');
	const savedRole = explicitUndefinedSave ? undefined : (instance as unknown as Domain.Contexts.User.StaffRole.StaffRoleEntityReference);

	const repo = {
		getById: vi.fn().mockResolvedValue(instance),
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
	let command: StaffRoleUpdateCommand;
	let result: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | undefined;
	let thrownError: unknown;
	let roleInstance: MockStaffRoleInstance;

	BeforeEachScenario(() => {
		result = undefined;
		thrownError = undefined;
		roleInstance = makeMockStaffRoleInstance('role-001');
		command = { roleId: 'role-001', roleName: 'Updated Role' };
	});

	// ─── Update roleName ──────────────────────────────────────────────────────

	Scenario('Successfully updates a staff role name', ({ Given, When, Then, And }) => {
		Given('a staff role with id "role-001" exists in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('role-001');
			dataSources = makeDataSources({ roleInstance });
			command = { roleId: 'role-001', roleName: 'Updated Role' };
		});

		When('I call update with roleId "role-001" and roleName "Updated Role"', async () => {
			try {
				result = await update(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('the staff role should be saved', () => {
			const repo = dataSources._repo as { save: ReturnType<typeof vi.fn> };
			expect(repo.save).toHaveBeenCalled();
		});

		And('the result should have roleName "Updated Role"', () => {
			expect(thrownError).toBeUndefined();
			expect(result).toBeDefined();
			expect(roleInstance.roleName).toBe('Updated Role');
		});
	});

	// ─── Update enterpriseAppRole ─────────────────────────────────────────────

	Scenario('Successfully updates a staff role with an enterpriseAppRole', ({ Given, When, Then }) => {
		Given('a staff role with id "role-002" exists in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('role-002');
			dataSources = makeDataSources({ roleInstance });
			command = { roleId: 'role-002', roleName: 'Updated Role', enterpriseAppRole: 'Staff.UpdatedRole' };
		});

		When('I call update with roleId "role-002" and enterpriseAppRole "Staff.UpdatedRole"', async () => {
			try {
				result = await update(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('the staff role should be saved with enterpriseAppRole "Staff.UpdatedRole"', () => {
			expect(thrownError).toBeUndefined();
			expect(roleInstance.enterpriseAppRole).toBe('Staff.UpdatedRole');
		});
	});

	// ─── Update community permissions ─────────────────────────────────────────

	Scenario('Successfully updates a staff role with community permissions', ({ Given, When, Then, And }) => {
		Given('a staff role with id "role-003" exists in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('role-003');
			dataSources = makeDataSources({ roleInstance });
			command = {
				roleId: 'role-003',
				roleName: 'Admin Role',
				permissions: { community: { canManageCommunities: true } },
			};
		});

		When('I call update with roleId "role-003" and community permissions canManageCommunities true', async () => {
			try {
				result = await update(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('the staff role should be saved', () => {
			const repo = dataSources._repo as { save: ReturnType<typeof vi.fn> };
			expect(repo.save).toHaveBeenCalled();
		});

		And('the community permission canManageCommunities should be true', () => {
			expect(thrownError).toBeUndefined();
			expect(roleInstance.permissions.communityPermissions.canManageCommunities).toBe(true);
		});
	});

	// ─── Update user permissions ──────────────────────────────────────────────

	Scenario('Successfully updates a staff role with user permissions', ({ Given, When, Then, And }) => {
		Given('a staff role with id "role-004" exists in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('role-004');
			dataSources = makeDataSources({ roleInstance });
			command = {
				roleId: 'role-004',
				roleName: 'Manager Role',
				permissions: { user: { canManageUsers: true } },
			};
		});

		When('I call update with roleId "role-004" and user permissions canManageUsers true', async () => {
			try {
				result = await update(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('the staff role should be saved', () => {
			const repo = dataSources._repo as { save: ReturnType<typeof vi.fn> };
			expect(repo.save).toHaveBeenCalled();
		});

		And('the user permission canManageUsers should be true', () => {
			expect(thrownError).toBeUndefined();
			expect(roleInstance.permissions.userPermissions.canManageUsers).toBe(true);
		});
	});

	// ─── enterpriseAppRole not applied when absent ────────────────────────────

	Scenario('Does not apply enterpriseAppRole when it is not provided', ({ Given, When, Then }) => {
		Given('a staff role with id "role-005" exists in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('role-005');
			roleInstance.enterpriseAppRole = 'Original.AppRole';
			dataSources = makeDataSources({ roleInstance });
			command = { roleId: 'role-005', roleName: 'Some Role' };
		});

		When('I call update with roleId "role-005" and no enterpriseAppRole', async () => {
			try {
				result = await update(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('the staff role enterpriseAppRole should remain unchanged', () => {
			expect(thrownError).toBeUndefined();
			expect(roleInstance.enterpriseAppRole).toBe('Original.AppRole');
		});
	});

	// ─── Save fails ───────────────────────────────────────────────────────────

	Scenario('Throws when repository fails to save the updated role', ({ Given, When, Then, And }) => {
		Given('a staff role with id "role-err" exists in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('role-err');
		});

		And('saving the staff role returns undefined', () => {
			dataSources = makeDataSources({ roleInstance, explicitUndefinedSave: true });
			command = { roleId: 'role-err', roleName: 'Any Role' };
		});

		When('I call update with roleId "role-err" and roleName "Any Role"', async () => {
			try {
				result = await update(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('it should throw an error with message "Unable to update staff role"', () => {
			expect(thrownError).toBeDefined();
			expect((thrownError as Error).message).toBe('Unable to update staff role');
		});
	});

	// ─── All community permissions ────────────────────────────────────────────

	Scenario('Successfully updates a staff role with all community permissions set', ({ Given, When, Then }) => {
		Given('a staff role with id "role-all-comm" exists in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('role-all-comm');
			dataSources = makeDataSources({ roleInstance });
			command = {
				roleId: 'role-all-comm',
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
		When('I call update with all community permissions true', async () => {
			try {
				result = await update(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});
		Then('all community permissions should be true on the updated instance', () => {
			expect(thrownError).toBeUndefined();
			const cp = roleInstance.permissions.communityPermissions;
			expect(cp.canManageCommunities).toBe(true);
			expect(cp.canManageStaffRolesAndPermissions).toBe(true);
			expect(cp.canManageAllCommunities).toBe(true);
			expect(cp.canDeleteCommunities).toBe(true);
			expect(cp.canChangeCommunityOwner).toBe(true);
			expect(cp.canReIndexSearchCollections).toBe(true);
		});
	});

	// ─── canAssignStaffUserRoles ──────────────────────────────────────────────

	Scenario('Successfully updates a staff role with canAssignStaffUserRoles set', ({ Given, When, Then }) => {
		Given('a staff role with id "role-assign" exists in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('role-assign');
			dataSources = makeDataSources({ roleInstance });
			command = {
				roleId: 'role-assign',
				roleName: 'Assign Role',
				permissions: { user: { canAssignStaffUserRoles: true } },
			};
		});
		When('I call update with user permissions canAssignStaffUserRoles true', async () => {
			try {
				result = await update(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});
		Then('the user permission canAssignStaffUserRoles should be true', () => {
			expect(thrownError).toBeUndefined();
			expect(roleInstance.permissions.userPermissions.canAssignStaffUserRoles).toBe(true);
		});
	});

	// ─── No-op when sub-objects absent ───────────────────────────────────────

	Scenario('Omitting community permissions sub-object leaves community permissions unchanged', ({ Given, When, Then }) => {
		Given('a staff role with id "role-noc" exists in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('role-noc');
			dataSources = makeDataSources({ roleInstance });
			command = {
				roleId: 'role-noc',
				roleName: 'Some Role',
				permissions: { user: { canManageUsers: true } },
			};
		});
		When('I call update with only user permissions', async () => {
			try {
				result = await update(dataSources)(command);
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
		Given('a staff role with id "role-nou" exists in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('role-nou');
			dataSources = makeDataSources({ roleInstance });
			command = {
				roleId: 'role-nou',
				roleName: 'Some Role',
				permissions: { community: { canManageCommunities: true } },
			};
		});
		When('I call update with only community permissions', async () => {
			try {
				result = await update(dataSources)(command);
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

	// ─── getById called with roleId ───────────────────────────────────────────

	Scenario('getById is called with the provided role id', ({ Given, When, Then }) => {
		Given('a staff role with id "role-lookup" exists in the repository', () => {
			roleInstance = makeMockStaffRoleInstance('role-lookup');
			dataSources = makeDataSources({ roleInstance });
			command = { roleId: 'role-lookup', roleName: 'Any Role' };
		});
		When('I call update with roleId "role-lookup" and roleName "Any Role"', async () => {
			try {
				result = await update(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});
		Then('getById should have been called with "role-lookup"', () => {
			expect(thrownError).toBeUndefined();
			const repo = dataSources._repo as { getById: ReturnType<typeof vi.fn> };
			expect(repo.getById).toHaveBeenCalledWith('role-lookup');
		});
	});
});
