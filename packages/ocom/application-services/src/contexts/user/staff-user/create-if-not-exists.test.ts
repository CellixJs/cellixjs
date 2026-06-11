import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { expect, vi } from 'vitest';
import { StaffAppRoleNames } from '../staff-role/create-default-roles.ts';
import { createIfNotExists, type StaffUserCreateIfNotExistsCommand } from './create-if-not-exists.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/create-if-not-exists.feature'));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMockStaffUserRef(externalId: string, overrides: Partial<Domain.Contexts.User.StaffUser.StaffUserEntityReference> = {}): Domain.Contexts.User.StaffUser.StaffUserEntityReference {
	return {
		id: `id-${externalId}`,
		externalId,
		firstName: 'Test',
		lastName: 'User',
		email: 'test@example.com',
		displayName: 'Test User',
		accessBlocked: false,
		tags: [],
		userType: 'staff',
		role: undefined,
		createdAt: new Date(),
		updatedAt: new Date(),
		schemaVersion: '1.0',
		...overrides,
	} as unknown as Domain.Contexts.User.StaffUser.StaffUserEntityReference;
}

function makeMockStaffRoleRef(roleName: string): Domain.Contexts.User.StaffRole.StaffRoleEntityReference {
	return {
		id: `role-id-${roleName}`,
		roleName,
		enterpriseAppRole: roleName,
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

interface MockStaffUserInstance extends Domain.Contexts.User.StaffUser.StaffUserEntityReference {
	role: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | undefined;
}

function makeMockNewUser(externalId: string): MockStaffUserInstance {
	let _role: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | undefined;
	return {
		id: `new-id-${externalId}`,
		externalId,
		firstName: 'First',
		lastName: 'Last',
		email: 'first@example.com',
		displayName: 'First Last',
		accessBlocked: false,
		tags: [],
		userType: 'staff',
		get role() {
			return _role;
		},
		set role(r: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | undefined) {
			_role = r;
		},
		requestCreate: vi.fn(),
		requestRoleAssignment: vi.fn().mockImplementation((r: Domain.Contexts.User.StaffRole.StaffRoleEntityReference) => {
			_role = r;
		}),
		createdAt: new Date(),
		updatedAt: new Date(),
		schemaVersion: '1.0',
	} as unknown as MockStaffUserInstance;
}

function makeDataSources(overrides: {
	existingUser?: Domain.Contexts.User.StaffUser.StaffUserEntityReference | null;
	existingUserByEmail?: Domain.Contexts.User.StaffUser.StaffUserEntityReference | null;
	newUser?: MockStaffUserInstance;
	savedUser?: Domain.Contexts.User.StaffUser.StaffUserEntityReference;
	roleByEnterpriseAppRole?: Record<string, Domain.Contexts.User.StaffRole.StaffRoleEntityReference>;
	saveShouldFail?: boolean;
}): DataSources {
	const newUser = overrides.newUser ?? makeMockNewUser('default');
	const savedUser = overrides.savedUser ?? (newUser as unknown as Domain.Contexts.User.StaffUser.StaffUserEntityReference);

	const staffUserRepo = {
		getByExternalId: vi.fn().mockResolvedValue(overrides.existingUser ?? null),
		get: vi.fn().mockResolvedValue(overrides.existingUserByEmail ?? newUser),
		getNewInstance: vi.fn().mockResolvedValue(newUser),
		save: overrides.saveShouldFail ? vi.fn().mockResolvedValue(undefined) : vi.fn().mockResolvedValue(savedUser),
		delete: vi.fn(),
	} as unknown as Domain.Contexts.User.StaffUser.StaffUserRepository<Domain.Contexts.User.StaffUser.StaffUserProps>;

	const staffRoleRepo = {
		getByRoleName: vi.fn().mockImplementation((roleName: string) => {
			const role = Object.values(overrides.roleByEnterpriseAppRole ?? {}).find((candidate) => candidate.roleName === roleName);
			if (role) {
				return Promise.resolve(role);
			}
			return Promise.reject(new Error(`NotFoundError: ${roleName} not found`));
		}),
		getDefaultRoleByEnterpriseAppRole: vi.fn().mockImplementation((enterpriseAppRole: string) => {
			const role = overrides.roleByEnterpriseAppRole?.[enterpriseAppRole];
			if (role) {
				return Promise.resolve(role);
			}
			return Promise.reject(new Error(`NotFoundError: ${enterpriseAppRole} not found`));
		}),
		getNewInstance: vi.fn().mockImplementation((name: string) => Promise.resolve(makeMockStaffRoleRef(name))),
		getNewDefaultCaseManagerInstance: vi.fn().mockResolvedValue(makeMockStaffRoleRef(StaffAppRoleNames.CaseManager)),
		getNewDefaultServiceLineOwnerInstance: vi.fn().mockResolvedValue(makeMockStaffRoleRef(StaffAppRoleNames.ServiceLineOwner)),
		getNewDefaultFinanceInstance: vi.fn().mockResolvedValue(makeMockStaffRoleRef(StaffAppRoleNames.Finance)),
		getNewDefaultTechAdminInstance: vi.fn().mockResolvedValue(makeMockStaffRoleRef(StaffAppRoleNames.TechAdmin)),
		save: vi.fn().mockImplementation((r: unknown) => Promise.resolve(r)),
	} as unknown as Domain.Contexts.User.StaffRole.StaffRoleRepository<Domain.Contexts.User.StaffRole.StaffRoleProps>;

	return {
		readonlyDataSource: {
			User: {
				StaffUser: {
					StaffUserReadRepo: {
						getByExternalId: vi.fn().mockResolvedValue(overrides.existingUser ?? null),
						getByEmail: vi.fn().mockResolvedValue(overrides.existingUserByEmail ?? null),
					},
				},
			},
		},
		domainDataSource: {
			User: {
				StaffUser: {
					StaffUserUnitOfWork: {
						withTransaction: vi.fn().mockImplementation(async (_passport: unknown, cb: (repo: typeof staffUserRepo) => Promise<void>) => {
							await cb(staffUserRepo);
						}),
					},
				},
				StaffRole: {
					StaffRoleUnitOfWork: {
						withTransaction: vi.fn().mockImplementation(async (_passport: unknown, cb: (repo: typeof staffRoleRepo) => Promise<void>) => {
							await cb(staffRoleRepo);
						}),
						withScopedTransaction: vi.fn().mockImplementation(async (cb: (repo: typeof staffRoleRepo) => Promise<void>) => {
							await cb(staffRoleRepo);
						}),
					},
				},
			},
		},
		_staffUserRepo: staffUserRepo,
		_staffRoleRepo: staffRoleRepo,
	} as unknown as DataSources;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let dataSources: DataSources & { _staffUserRepo?: typeof Object; _staffRoleRepo?: typeof Object };
	let command: StaffUserCreateIfNotExistsCommand;
	let result: Domain.Contexts.User.StaffUser.StaffUserEntityReference | undefined;
	let thrownError: unknown;
	let existingUser: Domain.Contexts.User.StaffUser.StaffUserEntityReference | null;
	let newUser: MockStaffUserInstance;

	BeforeEachScenario(() => {
		result = undefined;
		thrownError = undefined;
		existingUser = null;
		newUser = makeMockNewUser('default');
		command = {
			externalId: 'ext-default',
			firstName: 'First',
			lastName: 'Last',
			email: 'first@example.com',
			aadRoles: [],
		};
	});

	// ─── Returns existing user ────────────────────────────────────────────────

	Scenario('Returns existing user when user already exists', ({ Given, When, Then, And }) => {
		Given('a staff user with externalId "ext-123" already exists', () => {
			existingUser = makeMockStaffUserRef('ext-123');
			dataSources = makeDataSources({ existingUser });
			command = { ...command, externalId: 'ext-123' };
		});

		When('I call createIfNotExists with externalId "ext-123"', async () => {
			result = await createIfNotExists(dataSources)(command);
		});

		Scenario('Updates externalId when user exists by email', ({ Given, When, Then, And }) => {
			Given('a staff user with email "first@example.com" already exists', () => {
				existingUser = makeMockStaffUserRef('ext-old', { email: 'first@example.com' });
				dataSources = makeDataSources({ existingUserByEmail: existingUser, savedUser: { ...existingUser, externalId: 'ext-new' } });
				command = { ...command, externalId: 'ext-new' };
			});

			When('I call createIfNotExists with externalId "ext-new"', async () => {
				result = await createIfNotExists(dataSources)(command);
			});

			Then("it should update the existing user's externalId", () => {
				const repo = (dataSources as unknown as { _staffUserRepo: { save: ReturnType<typeof vi.fn> } })._staffUserRepo;
				expect(repo.save).toHaveBeenCalled();
			});

			And('it should return the updated user', () => {
				expect(result?.externalId).toBe('ext-new');
			});
		});

		Then('it should return the existing user', () => {
			expect(result).toBe(existingUser);
		});

		And('it should not create a new user', () => {
			const repo = (dataSources as unknown as { _staffUserRepo: { getNewInstance: ReturnType<typeof vi.fn> } })._staffUserRepo;
			expect(repo.getNewInstance).not.toHaveBeenCalled();
		});
	});

	// ─── Creates new user (no role) ───────────────────────────────────────────

	Scenario('Creates a new user when user does not exist', ({ Given, When, Then, And }) => {
		Given('no staff user with externalId "ext-456" exists', () => {
			newUser = makeMockNewUser('ext-456');
			dataSources = makeDataSources({ existingUser: null, newUser });
			command = { ...command, externalId: 'ext-456', aadRoles: [] };
		});

		And('no matching AAD role is provided', () => {
			// aadRoles is already []
		});

		When('I call createIfNotExists with externalId "ext-456"', async () => {
			result = await createIfNotExists(dataSources)(command);
		});

		Then('it should call createDefaultRoles', () => {
			const roleUow = (
				dataSources as unknown as {
					domainDataSource: { User: { StaffRole: { StaffRoleUnitOfWork: { withTransaction: ReturnType<typeof vi.fn> } } } };
				}
			).domainDataSource.User.StaffRole.StaffRoleUnitOfWork;
			expect(roleUow.withTransaction).toHaveBeenCalled();
		});

		And('it should create a new user with the provided details', () => {
			const repo = (dataSources as unknown as { _staffUserRepo: { getNewInstance: ReturnType<typeof vi.fn> } })._staffUserRepo;
			expect(repo.getNewInstance).toHaveBeenCalledWith('ext-456', 'First', 'Last', 'first@example.com');
		});

		And('it should return the newly created user', () => {
			expect(result).toBeDefined();
			expect(result?.externalId).toBe('ext-456');
		});
	});

	// ─── Assigns matching role ────────────────────────────────────────────────

	Scenario('Creates a new user with a matching role when AAD role matches', ({ Given, When, Then, And }) => {
		let roleRef: Domain.Contexts.User.StaffRole.StaffRoleEntityReference;

		Given('no staff user with externalId "ext-789" exists', () => {
			roleRef = makeMockStaffRoleRef(StaffAppRoleNames.CaseManager);
			newUser = makeMockNewUser('ext-789');
			dataSources = makeDataSources({
				existingUser: null,
				newUser,
				roleByEnterpriseAppRole: { 'Staff.CaseManager': roleRef },
			});
			command = { ...command, externalId: 'ext-789' };
		});

		And('the AAD roles include "Staff.CaseManager"', () => {
			command = { ...command, aadRoles: ['Staff.CaseManager'] };
		});

		And('the "Staff.CaseManager" role exists in the repository', () => {
			// role was set up in Given
		});

		When('I call createIfNotExists with externalId "ext-789"', async () => {
			result = await createIfNotExists(dataSources)(command);
		});

		Then('it should assign the "Staff.CaseManager" role to the new user', () => {
			expect(newUser.role).toBeDefined();
			expect(newUser.role?.roleName).toBe(StaffAppRoleNames.CaseManager);
		});
	});

	Scenario('Assigns Default.TechAdmin when AAD role is enterprise app role', ({ Given, When, Then, And }) => {
		let roleRef: Domain.Contexts.User.StaffRole.StaffRoleEntityReference;

		Given('no staff user with externalId "ext-201" exists', () => {
			roleRef = makeMockStaffRoleRef(StaffAppRoleNames.TechAdmin);
			newUser = makeMockNewUser('ext-201');
			dataSources = makeDataSources({
				existingUser: null,
				newUser,
				roleByEnterpriseAppRole: { 'Staff.TechAdmin': roleRef },
			});
			command = { ...command, externalId: 'ext-201' };
		});

		And('the AAD roles include "Staff.TechAdmin"', () => {
			command = { ...command, aadRoles: ['Staff.TechAdmin'] };
		});

		And('the "Default.TechAdmin" role exists in the repository', () => {
			// role was set up in Given
		});

		When('I call createIfNotExists with externalId "ext-201"', async () => {
			result = await createIfNotExists(dataSources)(command);
		});

		Then('it should assign the "Default.TechAdmin" role to the new user', () => {
			expect(newUser.role).toBeDefined();
			expect(newUser.role?.roleName).toBe(StaffAppRoleNames.TechAdmin);
		});
	});

	Scenario('Assigns highest priority matching role when multiple AAD roles are provided', ({ Given, When, Then, And }) => {
		let techAdminRole: Domain.Contexts.User.StaffRole.StaffRoleEntityReference;
		let caseManagerRole: Domain.Contexts.User.StaffRole.StaffRoleEntityReference;

		Given('no staff user with externalId "ext-202" exists', () => {
			techAdminRole = makeMockStaffRoleRef(StaffAppRoleNames.TechAdmin);
			caseManagerRole = makeMockStaffRoleRef(StaffAppRoleNames.CaseManager);
			newUser = makeMockNewUser('ext-202');
			dataSources = makeDataSources({
				existingUser: null,
				newUser,
				roleByEnterpriseAppRole: {
					'Staff.TechAdmin': techAdminRole,
					'Staff.CaseManager': caseManagerRole,
				},
			});
			command = { ...command, externalId: 'ext-202' };
		});

		And('the AAD roles include "Unknown.Role", "Staff.TechAdmin", and "Staff.CaseManager"', () => {
			command = { ...command, aadRoles: ['Unknown.Role', 'Staff.TechAdmin', 'Staff.CaseManager'] };
		});

		And('the "Default.TechAdmin" and "Default.CaseManager" roles exist in the repository', () => {
			// roles were set up in Given
		});

		When('I call createIfNotExists with externalId "ext-202"', async () => {
			result = await createIfNotExists(dataSources)(command);
		});

		Then('it should assign the "Default.TechAdmin" role to the new user', () => {
			expect(newUser.role).toBeDefined();
			expect(newUser.role?.roleName).toBe(StaffAppRoleNames.TechAdmin);
		});
	});

	Scenario('Creates a new user without a role when AAD role has alternate formatting', ({ Given, When, Then, And }) => {
		Given('no staff user with externalId "ext-203" exists', () => {
			newUser = makeMockNewUser('ext-203');
			dataSources = makeDataSources({ existingUser: null, newUser });
			command = { ...command, externalId: 'ext-203' };
		});

		And('the AAD roles include "default tech admin"', () => {
			command = { ...command, aadRoles: ['default tech admin'] };
		});

		When('I call createIfNotExists with externalId "ext-203"', async () => {
			result = await createIfNotExists(dataSources)(command);
		});

		Then('it should create the user without assigning a role', () => {
			expect(newUser.role).toBeUndefined();
		});
	});

	// ─── No role when AAD role unknown ────────────────────────────────────────

	Scenario('Creates a new user without a role when no AAD role matches', ({ Given, When, Then, And }) => {
		Given('no staff user with externalId "ext-000" exists', () => {
			newUser = makeMockNewUser('ext-000');
			dataSources = makeDataSources({ existingUser: null, newUser });
			command = { ...command, externalId: 'ext-000' };
		});

		And('the AAD roles include "Unknown.Role"', () => {
			command = { ...command, aadRoles: ['Unknown.Role'] };
		});

		When('I call createIfNotExists with externalId "ext-000"', async () => {
			result = await createIfNotExists(dataSources)(command);
		});

		Then('it should create the user without assigning a role', () => {
			expect(newUser.role).toBeUndefined();
		});
	});

	// ─── No role when empty AAD roles ────────────────────────────────────────

	Scenario('Creates a new user without a role when AAD roles list is empty', ({ Given, When, Then, And }) => {
		Given('no staff user with externalId "ext-111" exists', () => {
			newUser = makeMockNewUser('ext-111');
			dataSources = makeDataSources({ existingUser: null, newUser });
			command = { ...command, externalId: 'ext-111' };
		});

		And('the AAD roles list is empty', () => {
			command = { ...command, aadRoles: [] };
		});

		When('I call createIfNotExists with externalId "ext-111"', async () => {
			result = await createIfNotExists(dataSources)(command);
		});

		Then('it should create the user without assigning a role', () => {
			expect(newUser.role).toBeUndefined();
		});
	});

	// ─── Throws when save returns undefined ───────────────────────────────────

	Scenario('Throws when repository fails to save the new user', ({ Given, When, Then }) => {
		Given('no staff user with externalId "ext-err" exists', () => {
			// save returns undefined to simulate a failed save (createdUser stays undefined)
			newUser = makeMockNewUser('ext-err');
			dataSources = makeDataSources({ existingUser: null, newUser, saveShouldFail: true });
			command = { ...command, externalId: 'ext-err', aadRoles: [] };
		});

		When('I call createIfNotExists with externalId "ext-err"', async () => {
			try {
				await createIfNotExists(dataSources)(command);
			} catch (error) {
				thrownError = error;
			}
		});

		Then('it should throw an error with message "Unable to create staff user"', () => {
			expect(thrownError).toBeInstanceOf(Error);
			expect((thrownError as Error).message).toBe('Unable to create staff user');
		});
	});

	// ─── Empty email skips email lookup ───────────────────────────────────────

	Scenario('Creates a new user when email is empty', ({ Given, When, Then, And }) => {
		Given('no staff user with externalId "ext-noemail" exists', () => {
			newUser = makeMockNewUser('ext-noemail');
			dataSources = makeDataSources({ existingUser: null, newUser });
			command = { ...command, externalId: 'ext-noemail' };
		});

		And('the command has an empty email', () => {
			command = { ...command, email: '' };
		});

		When('I call createIfNotExists with externalId "ext-noemail"', async () => {
			result = await createIfNotExists(dataSources)(command);
		});

		Then('it should not check for an existing user by email', () => {
			const readRepo = (
				dataSources as unknown as {
					readonlyDataSource: { User: { StaffUser: { StaffUserReadRepo: { getByEmail: ReturnType<typeof vi.fn> } } } };
				}
			).readonlyDataSource.User.StaffUser.StaffUserReadRepo;
			expect(readRepo.getByEmail).not.toHaveBeenCalled();
		});

		And('it should return the newly created user', () => {
			expect(result).toBeDefined();
			expect(result?.externalId).toBe('ext-noemail');
		});
	});

	// ─── Email lookup returns null → create new user ──────────────────────────

	Scenario('Creates a new user when email lookup returns no match', ({ Given, When, Then, And }) => {
		Given('no staff user with externalId "ext-nomatch" exists', () => {
			newUser = makeMockNewUser('ext-nomatch');
			// existingUserByEmail: null means getByEmail resolves null
			dataSources = makeDataSources({ existingUser: null, existingUserByEmail: null, newUser });
			command = { ...command, externalId: 'ext-nomatch', email: 'other@example.com' };
		});

		And('a staff user with email "other@example.com" does not exist', () => {
			// getByEmail will return null (set up in Given)
		});

		When('I call createIfNotExists with externalId "ext-nomatch"', async () => {
			result = await createIfNotExists(dataSources)(command);
		});

		Then('it should create a new user', () => {
			const repo = (dataSources as unknown as { _staffUserRepo: { getNewInstance: ReturnType<typeof vi.fn> } })._staffUserRepo;
			expect(repo.getNewInstance).toHaveBeenCalledWith('ext-nomatch', 'First', 'Last', 'other@example.com');
		});

		And('it should return the newly created user', () => {
			expect(result).toBeDefined();
			expect(result?.externalId).toBe('ext-nomatch');
		});
	});

	// ─── Email-update save returns undefined → throws ─────────────────────────

	Scenario('Throws when update of externalId fails to save', ({ Given, When, Then, And }) => {
		Given('a staff user with email "first@example.com" already exists', () => {
			existingUser = makeMockStaffUserRef('ext-old', { email: 'first@example.com' });
			// saveShouldFail makes save() resolve undefined, triggering the throw
			dataSources = makeDataSources({ existingUser: null, existingUserByEmail: existingUser, saveShouldFail: true });
			command = { ...command, externalId: 'ext-updfail', email: 'first@example.com' };
		});

		And('the update transaction save returns undefined', () => {
			// already wired up in Given via saveShouldFail: true
		});

		When('I call createIfNotExists with externalId "ext-updfail"', async () => {
			try {
				await createIfNotExists(dataSources)(command);
			} catch (error) {
				thrownError = error;
			}
		});

		Then('it should throw an error with message "Unable to update staff user externalId"', () => {
			expect(thrownError).toBeInstanceOf(Error);
			expect((thrownError as Error).message).toBe('Unable to update staff user externalId');
		});
	});

	// ─── Non-NotFound error from role lookup propagates ───────────────────────

	Scenario('Propagates non-NotFound errors from role lookup', ({ Given, When, Then, And }) => {
		const dbError = new Error('Database connection failed');

		Given('no staff user with externalId "ext-rolerr" exists', () => {
			newUser = makeMockNewUser('ext-rolerr');
			dataSources = makeDataSources({ existingUser: null, newUser });
			// Override getDefaultRoleByEnterpriseAppRole to throw a non-NotFound error
			(dataSources as unknown as { _staffRoleRepo: { getDefaultRoleByEnterpriseAppRole: ReturnType<typeof vi.fn> } })._staffRoleRepo.getDefaultRoleByEnterpriseAppRole.mockRejectedValue(dbError);
			command = { ...command, externalId: 'ext-rolerr', aadRoles: ['Staff.CaseManager'] };
		});

		And('the role repository throws a non-NotFound error for any AAD role', () => {
			// already wired up in Given
		});

		When('I call createIfNotExists with externalId "ext-rolerr"', async () => {
			try {
				await createIfNotExists(dataSources)(command);
			} catch (error) {
				thrownError = error;
			}
		});

		Then('it should propagate the role repository error', () => {
			expect(thrownError).toBe(dbError);
		});
	});
});
