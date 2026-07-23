import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { expect, vi } from 'vitest';
import { assignRole, type StaffUserAssignRoleCommand } from './assign-role.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/assign-role.feature'));

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface MockStaffUserInstance extends Domain.Contexts.User.StaffUser.StaffUserEntityReference {
	role: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | undefined;
	readonly roleId: string | undefined;
}

interface MockStaffUserRepository {
	get: ReturnType<typeof vi.fn>;
	save: ReturnType<typeof vi.fn>;
	setRoleIfCurrent: ReturnType<typeof vi.fn>;
}

interface MockStaffRoleRepository {
	getById: ReturnType<typeof vi.fn>;
}

type TestDataSources = DataSources & {
	_staffUserRepo: MockStaffUserRepository;
	_staffRoleRepo: MockStaffRoleRepository;
};

function makeMockStaffRoleRef(id: string, deleted = false): Domain.Contexts.User.StaffRole.StaffRoleEntityReference {
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
		...(deleted
			? {
					deletion: {
						actorStaffUserId: 'actor-1',
						enterpriseAppRole: 'Staff.CaseManager',
						deletedAt: new Date('2026-07-23T12:00:00.000Z'),
					},
				}
			: {}),
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
		get roleId() {
			return _role?.id;
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
	savedUser?: Domain.Contexts.User.StaffUser.StaffUserEntityReference;
	explicitUndefinedSave?: boolean;
	roleUnavailableAfterSave?: boolean;
	roleDeletedAfterSave?: boolean;
	roleVerificationError?: Error;
	conditionalUpdateResult?: boolean;
	previousRoleDeletedAfterRollback?: boolean;
}): TestDataSources {
	const staffUser = overrides.staffUser ?? makeMockStaffUserInstance('user-123');
	const { staffRole } = overrides;
	const savedUser = overrides.explicitUndefinedSave ? undefined : (overrides.savedUser ?? staffUser);

	const staffUserRepo = {
		get: vi.fn().mockResolvedValue(staffUser),
		save: vi.fn().mockResolvedValue(savedUser),
		setRoleIfCurrent: vi.fn().mockResolvedValue(overrides.conditionalUpdateResult ?? true),
	};

	const getById = vi.fn();
	if (staffRole === null) {
		getById.mockResolvedValue(null);
	} else {
		let targetRoleLookupCount = 0;
		const roleLookupCounts = new Map<string, number>();
		getById.mockImplementation((id: string) => {
			if (id !== staffRole?.id) {
				const lookupCount = (roleLookupCounts.get(id) ?? 0) + 1;
				roleLookupCounts.set(id, lookupCount);
				return Promise.resolve(makeMockStaffRoleRef(id, Boolean(overrides.previousRoleDeletedAfterRollback && lookupCount > 1)));
			}
			targetRoleLookupCount += 1;
			if (targetRoleLookupCount > 1) {
				if (overrides.roleDeletedAfterSave) {
					return Promise.resolve(makeMockStaffRoleRef(id, true));
				}
				if (overrides.roleUnavailableAfterSave) {
					return Promise.reject(new NotFoundError(`StaffRole with id ${id} not found`));
				}
				if (overrides.roleVerificationError) {
					return Promise.reject(overrides.roleVerificationError);
				}
			}
			return Promise.resolve(staffRole);
		});
	}
	const staffRoleRepo = {
		getById,
	};

	const userUnitOfWork = {
		withScopedTransaction: vi.fn().mockImplementation(async (cb: (repo: typeof staffUserRepo) => Promise<void>) => {
			await cb(staffUserRepo);
		}),
		withTransaction: vi.fn().mockImplementation(async (_passport: unknown, cb: (repo: typeof staffUserRepo) => Promise<void>) => {
			await cb(staffUserRepo);
		}),
	};

	return {
		domainDataSource: {
			User: {
				StaffUser: {
					StaffUserUnitOfWork: userUnitOfWork,
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
	} as unknown as TestDataSources;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let dataSources: TestDataSources;
	let command: StaffUserAssignRoleCommand;
	let result: Domain.Contexts.User.StaffUser.StaffUserEntityReference | undefined;
	let thrownError: unknown;
	let staffUser: MockStaffUserInstance;
	let staffRole: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null;
	BeforeEachScenario(() => {
		vi.restoreAllMocks();
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

		And('the staff role should be validated before and after assignment', () => {
			const repo = dataSources._staffRoleRepo as { getById: ReturnType<typeof vi.fn> };
			expect(repo.getById).toHaveBeenCalledTimes(2);
		});
	});

	// ─── Role not found ───────────────────────────────────────────────────────

	Scenario('Throws an error when the staff role does not exist', ({ Given, When, Then, And }) => {
		Given('a staff user with id "user-123" exists', () => {
			staffUser = makeMockStaffUserInstance('user-123');
		});

		Scenario('Rejects a logically deleted staff role before assignment', ({ Given, And, When, Then }) => {
			Given('a staff user with id "user-123" exists', () => {
				staffUser = makeMockStaffUserInstance('user-123');
			});
			And('a deleted staff role with id "role-456" exists', () => {
				staffRole = makeMockStaffRoleRef('role-456', true);
				dataSources = makeDataSources({ staffUser, staffRole });
			});
			When('I call assignRole with staffUserId "user-123" and roleId "role-456"', async () => {
				try {
					await assignRole(dataSources)(command);
				} catch (error) {
					thrownError = error;
				}
			});
			Then('the deleted role should not be assigned', () => {
				expect(dataSources._staffUserRepo.save).not.toHaveBeenCalled();
			});
			And('it should throw an error with message containing "not available"', () => {
				expect((thrownError as Error).message).toContain('not available');
			});
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

	Scenario('Rolls back when the role is deleted during assignment', ({ Given, And, When, Then }) => {
		let reassignmentSpy: ReturnType<typeof vi.spyOn>;
		Given('a staff user with id "user-123" is assigned to role "role-previous"', () => {
			staffUser = makeMockStaffUserInstance('user-123');
			staffUser.role = makeMockStaffRoleRef('role-previous');
		});

		And('role "role-456" is deleted after the staff user is saved', () => {
			staffRole = makeMockStaffRoleRef('role-456');
			dataSources = makeDataSources({ staffUser, staffRole, roleDeletedAfterSave: true });
			reassignmentSpy = vi.spyOn(Domain.Services.User.StaffRoleDeletedReassignmentService, 'reassignStaffUsersToDefaultRole').mockResolvedValue(undefined);
		});

		When('I call assignRole with staffUserId "user-123" and roleId "role-456"', async () => {
			try {
				result = await assignRole(dataSources)(command);
			} catch (error) {
				thrownError = error;
			}
		});

		Then('the committed role "role-456" should be conditionally replaced with "role-previous"', () => {
			expect(dataSources._staffUserRepo.setRoleIfCurrent).toHaveBeenCalledWith(
				expect.objectContaining({
					staffUserId: 'user-123',
					expectedCurrentRoleId: 'role-456',
					expectedUpdatedAt: staffUser.updatedAt,
					replacementRoleId: 'role-previous',
				}),
			);
		});

		And('no independent bulk reassignment should be started', () => {
			expect(reassignmentSpy).not.toHaveBeenCalled();
		});

		And('it should throw an error with message containing "no longer available"', () => {
			expect((thrownError as Error).name).toBe('NotFoundError');
			expect((thrownError as Error).message).toContain('no longer available');
		});
	});

	Scenario('Rolls back a committed assignment when role verification fails', ({ Given, And, When, Then }) => {
		const verificationError = new Error('Database connection lost');
		Given('a staff user with id "user-123" is assigned to role "role-previous"', () => {
			staffUser = makeMockStaffUserInstance('user-123');
			staffUser.role = makeMockStaffRoleRef('role-previous');
		});

		And('role "role-456" verification fails after the staff user is saved', () => {
			staffRole = makeMockStaffRoleRef('role-456');
			dataSources = makeDataSources({ staffUser, staffRole, roleVerificationError: verificationError });
		});

		When('I call assignRole with staffUserId "user-123" and roleId "role-456"', async () => {
			try {
				result = await assignRole(dataSources)(command);
			} catch (error) {
				thrownError = error;
			}
		});

		Then('the committed role "role-456" should be conditionally replaced with "role-previous"', () => {
			expect(dataSources._staffUserRepo.setRoleIfCurrent).toHaveBeenCalledWith(
				expect.objectContaining({
					staffUserId: 'user-123',
					expectedCurrentRoleId: 'role-456',
					replacementRoleId: 'role-previous',
					activityType: 'ROLE_ASSIGNED',
				}),
			);
		});

		And('it should report the role verification failure', () => {
			expect(thrownError).toBe(verificationError);
		});
	});

	Scenario('Reprocesses a previous role deleted during rollback', ({ Given, And, When, Then }) => {
		let recoverySpy: ReturnType<typeof vi.spyOn>;
		Given('a staff user with id "user-123" is assigned to role "role-previous"', () => {
			staffUser = makeMockStaffUserInstance('user-123');
			staffUser.role = makeMockStaffRoleRef('role-previous');
		});

		And('role "role-456" is deleted after the staff user is saved', () => {
			staffRole = makeMockStaffRoleRef('role-456');
		});

		And('role "role-previous" is deleted while the failed assignment is rolled back', () => {
			dataSources = makeDataSources({ staffUser, staffRole, roleDeletedAfterSave: true, previousRoleDeletedAfterRollback: true });
			recoverySpy = vi.spyOn(Domain.Services.User.StaffRoleDeletionRecoveryService, 'retryDeletedStaffRole').mockResolvedValue(true);
		});

		When('I call assignRole with staffUserId "user-123" and roleId "role-456"', async () => {
			try {
				result = await assignRole(dataSources)(command);
			} catch (error) {
				thrownError = error;
			}
		});

		Then('the committed role "role-456" should be conditionally replaced with "role-previous"', () => {
			expect(dataSources._staffUserRepo.setRoleIfCurrent).toHaveBeenCalledWith(
				expect.objectContaining({
					staffUserId: 'user-123',
					expectedCurrentRoleId: 'role-456',
					replacementRoleId: 'role-previous',
				}),
			);
		});

		And('the deletion event for role "role-previous" should be retried', () => {
			expect(recoverySpy).toHaveBeenCalledWith('role-previous', dataSources.domainDataSource);
		});

		And('it should throw an error with message containing "no longer available"', () => {
			expect((thrownError as Error).message).toContain('no longer available');
		});
	});

	Scenario('Does not overwrite a newer assignment during rollback', ({ Given, And, When, Then }) => {
		Given('a staff user with id "user-123" is assigned to role "role-previous"', () => {
			staffUser = makeMockStaffUserInstance('user-123');
			staffUser.role = makeMockStaffRoleRef('role-previous');
		});

		And('role "role-456" is deleted after the staff user is saved', () => {
			staffRole = makeMockStaffRoleRef('role-456');
		});

		And('the conditional rollback loses to a newer assignment', () => {
			dataSources = makeDataSources({ staffUser, staffRole, roleDeletedAfterSave: true, conditionalUpdateResult: false });
		});

		When('I call assignRole with staffUserId "user-123" and roleId "role-456"', async () => {
			try {
				result = await assignRole(dataSources)(command);
			} catch (error) {
				thrownError = error;
			}
		});

		Then('the newer assignment should be preserved', () => {
			expect(dataSources._staffUserRepo.setRoleIfCurrent).toHaveBeenCalledTimes(1);
			expect(dataSources._staffUserRepo.save).toHaveBeenCalledTimes(1);
		});

		And('it should report that compensation did not complete', () => {
			expect(thrownError).toBeInstanceOf(AggregateError);
			expect((thrownError as Error).message).toContain('compensation did not complete');
			expect((thrownError as AggregateError).errors[0]).toBeInstanceOf(NotFoundError);
			expect(((thrownError as AggregateError).errors[0] as Error).message).toContain('no longer available');
		});
	});

	Scenario('Rolls an initially unassigned user back to no role', ({ Given, And, When, Then }) => {
		const verificationError = new Error('Database connection lost');
		Given('a staff user with id "user-123" has no role', () => {
			staffUser = makeMockStaffUserInstance('user-123');
		});

		And('role "role-456" verification fails after the staff user is saved', () => {
			staffRole = makeMockStaffRoleRef('role-456');
			dataSources = makeDataSources({ staffUser, staffRole, roleVerificationError: verificationError });
		});

		When('I call assignRole with staffUserId "user-123" and roleId "role-456"', async () => {
			try {
				result = await assignRole(dataSources)(command);
			} catch (error) {
				thrownError = error;
			}
		});

		Then('the committed role "role-456" should be conditionally removed', () => {
			expect(dataSources._staffUserRepo.setRoleIfCurrent).toHaveBeenCalledWith(
				expect.not.objectContaining({
					replacementRoleId: expect.anything(),
				}),
			);
			expect(dataSources._staffUserRepo.setRoleIfCurrent).toHaveBeenCalledWith(
				expect.objectContaining({
					staffUserId: 'user-123',
					expectedCurrentRoleId: 'role-456',
					activityType: 'ROLE_REMOVED',
				}),
			);
		});

		And('it should report the role verification failure', () => {
			expect(thrownError).toBe(verificationError);
		});
	});
});
