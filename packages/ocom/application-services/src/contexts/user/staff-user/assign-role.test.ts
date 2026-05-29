import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { expect, vi } from 'vitest';
import { assignRole, type StaffUserAssignRoleCommand } from './assign-role.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/assign-role.feature'));

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface MockStaffUserInstance extends Domain.Contexts.User.StaffUser.StaffUserEntityReference {
	role: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | undefined;
}

function makeMockStaffRoleRef(id: string): Domain.Contexts.User.StaffRole.StaffRoleEntityReference {
	return {
		id,
		roleName: `role-${id}`,
		enterpriseAppRole: `role-${id}`,
		isDefault: false,
		roleType: null,
		permissions: {
			communityPermissions: { canManageCommunities: false },
			financePermissions: { canManageFinance: false },
			techAdminPermissions: { canManageTechAdmin: false },
			userPermissions: { canManageUsers: false },
		},
		createdAt: new Date(),
		updatedAt: new Date(),
		schemaVersion: '1.0',
	} as unknown as Domain.Contexts.User.StaffRole.StaffRoleEntityReference;
}

function makeMockStaffUserInstance(id: string): MockStaffUserInstance {
	let _role: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | undefined;
	return {
		id,
		externalId: `ext-${id}`,
		firstName: 'Test',
		lastName: 'User',
		email: 'test@example.com',
		displayName: 'Test User',
		accessBlocked: false,
		tags: [],
		userType: 'staff',
		get role() {
			return _role;
		},
		set role(r: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | undefined) {
			_role = r;
		},
		requestRoleAssignment: vi.fn().mockImplementation((r: Domain.Contexts.User.StaffRole.StaffRoleEntityReference) => {
			_role = r;
		}),
		createdAt: new Date(),
		updatedAt: new Date(),
		schemaVersion: '1.0',
	} as unknown as MockStaffUserInstance;
}

function makeDataSources(overrides: {
	staffUser?: MockStaffUserInstance;
	staffRole?: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null;
	savedUser?: Domain.Contexts.User.StaffUser.StaffUserEntityReference | undefined;
	explicitUndefinedSave?: boolean;
}): DataSources & { _staffUserRepo: unknown; _staffRoleRepo: unknown } {
	const staffUser = overrides.staffUser ?? makeMockStaffUserInstance('user-123');
	const { staffRole } = overrides;
	const savedUser = overrides.explicitUndefinedSave ? undefined : (overrides.savedUser ?? (staffUser as unknown as Domain.Contexts.User.StaffUser.StaffUserEntityReference));

	const staffUserRepo = {
		get: vi.fn().mockResolvedValue(staffUser),
		save: vi.fn().mockResolvedValue(savedUser),
	} as unknown as Domain.Contexts.User.StaffUser.StaffUserRepository<Domain.Contexts.User.StaffUser.StaffUserProps>;

	const staffRoleRepo = {
		getById: staffRole === null
			? vi.fn().mockResolvedValue(null)
			: vi.fn().mockResolvedValue(staffRole),
	} as unknown as Domain.Contexts.User.StaffRole.StaffRoleRepository<Domain.Contexts.User.StaffRole.StaffRoleProps>;

	return {
		domainDataSource: {
			User: {
				StaffUser: {
					StaffUserUnitOfWork: {
						withScopedTransaction: vi.fn().mockImplementation(async (cb: (repo: typeof staffUserRepo) => Promise<void>) => {
							await cb(staffUserRepo);
						}),
					},
				},
				StaffRole: {
					StaffRoleUnitOfWork: {
						withScopedTransaction: vi.fn().mockImplementation(async (cb: (repo: typeof staffRoleRepo) => Promise<void>) => {
							await cb(staffRoleRepo);
						}),
					},
				},
			},
		},
		_staffUserRepo: staffUserRepo,
		_staffRoleRepo: staffRoleRepo,
	} as unknown as DataSources & { _staffUserRepo: unknown; _staffRoleRepo: unknown };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let dataSources: DataSources & { _staffUserRepo?: unknown; _staffRoleRepo?: unknown };
	let command: StaffUserAssignRoleCommand;
	let result: Domain.Contexts.User.StaffUser.StaffUserEntityReference | undefined;
	let thrownError: unknown;
	let staffUser: MockStaffUserInstance;
	let staffRole: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null;
	BeforeEachScenario(() => {
		result = undefined;
		thrownError = undefined;
		staffUser = makeMockStaffUserInstance('user-123');
		staffRole = makeMockStaffRoleRef('role-456');
		command = { staffUserId: 'user-123', roleId: 'role-456', actorStaffUserId: 'actor-1' };
	});

	// ─── Successfully assigns a role ──────────────────────────────────────────

	Scenario('Successfully assigns a role to an existing staff user', ({ Given, When, Then, And }) => {
		Given('a staff user with id "user-123" exists', () => {
			staffUser = makeMockStaffUserInstance('user-123');
		});

		And('a staff role with id "role-456" exists', () => {
			staffRole = makeMockStaffRoleRef('role-456');
			dataSources = makeDataSources({ staffUser, staffRole });
			command = { staffUserId: 'user-123', roleId: 'role-456', actorStaffUserId: 'actor-1' };
		});

		When('I call assignRole with staffUserId "user-123" and roleId "role-456"', async () => {
			try {
				result = await assignRole(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('the staff user should be saved with the role assigned', () => {
			const repo = dataSources._staffUserRepo as { save: ReturnType<typeof vi.fn> };
			expect(repo.save).toHaveBeenCalled();
			expect(staffUser.role).toBe(staffRole);
		});

		And('the result should be the updated staff user', () => {
			expect(thrownError).toBeUndefined();
			expect(result).toBeDefined();
			expect(result?.id).toBe('user-123');
		});
	});

	// ─── Role not found ───────────────────────────────────────────────────────

	Scenario('Throws an error when the staff role does not exist', ({ Given, When, Then, And }) => {
		Given('a staff user with id "user-123" exists', () => {
			staffUser = makeMockStaffUserInstance('user-123');
		});

		And('no staff role with id "role-999" exists in the repository', () => {
			staffRole = null;
			dataSources = makeDataSources({ staffUser, staffRole });
			command = { staffUserId: 'user-123', roleId: 'role-999', actorStaffUserId: 'actor-1' };
		});

		When('I call assignRole with staffUserId "user-123" and roleId "role-999"', async () => {
			try {
				result = await assignRole(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('it should throw an error with message containing "role-999"', () => {
			expect(thrownError).toBeDefined();
			expect((thrownError as Error).message).toContain('role-999');
		});
	});

	// ─── Save returns undefined ───────────────────────────────────────────────

	Scenario('Throws an error when the unit of work returns no result', ({ Given, When, Then, And }) => {
		Given('a staff user with id "user-123" exists', () => {
			staffUser = makeMockStaffUserInstance('user-123');
		});

		And('a staff role with id "role-456" exists', () => {
			staffRole = makeMockStaffRoleRef('role-456');
		});

		And('saving the staff user returns undefined', () => {
			dataSources = makeDataSources({ staffUser, staffRole, explicitUndefinedSave: true });
			command = { staffUserId: 'user-123', roleId: 'role-456', actorStaffUserId: 'actor-1' };
		});

		When('I call assignRole with staffUserId "user-123" and roleId "role-456"', async () => {
			try {
				result = await assignRole(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('it should throw an error with message "Unable to assign role to staff user"', () => {
			expect(thrownError).toBeDefined();
			expect((thrownError as Error).message).toBe('Unable to assign role to staff user');
		});
	});
});
