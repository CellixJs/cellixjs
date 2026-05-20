import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { expect, vi } from 'vitest';
import { create, type StaffUserCreateCommand } from './create.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/create.feature'));

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

function makeMockNewUser(externalId: string): MockStaffUserInstance {
	let _role: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | undefined;
	return {
		id: `new-id-${externalId}`,
		externalId,
		firstName: 'John',
		lastName: 'Doe',
		email: 'test@example.com',
		displayName: 'John Doe',
		accessBlocked: false,
		tags: [],
		userType: 'staff',
		get role() {
			return _role;
		},
		set role(r: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | undefined) {
			_role = r;
		},
		createdAt: new Date(),
		updatedAt: new Date(),
		schemaVersion: '1.0',
	} as unknown as MockStaffUserInstance;
}

function makeMockStaffUserRef(
	externalId: string,
	overrides: Partial<Domain.Contexts.User.StaffUser.StaffUserEntityReference> = {},
): Domain.Contexts.User.StaffUser.StaffUserEntityReference {
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

function makeDataSources(overrides: {
	existingByExternalId?: Domain.Contexts.User.StaffUser.StaffUserEntityReference | null;
	existingByEmail?: Domain.Contexts.User.StaffUser.StaffUserEntityReference | null;
	newUser?: MockStaffUserInstance;
	staffRole?: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null;
	explicitUndefinedSave?: boolean;
}): DataSources & { _staffUserRepo: unknown; _staffRoleRepo: unknown } {
	const newUser = overrides.newUser ?? makeMockNewUser('ext-123');
	const { staffRole } = overrides;
	const savedUser = overrides.explicitUndefinedSave ? undefined : (newUser as unknown as Domain.Contexts.User.StaffUser.StaffUserEntityReference);

	const staffUserRepo = {
		getNewInstance: vi.fn().mockResolvedValue(newUser),
		save: vi.fn().mockResolvedValue(savedUser),
	} as unknown as Domain.Contexts.User.StaffUser.StaffUserRepository<Domain.Contexts.User.StaffUser.StaffUserProps>;

	const staffRoleRepo = {
		getById: staffRole === null
			? vi.fn().mockResolvedValue(null)
			: vi.fn().mockResolvedValue(staffRole),
	} as unknown as Domain.Contexts.User.StaffRole.StaffRoleRepository<Domain.Contexts.User.StaffRole.StaffRoleProps>;

	return {
		readonlyDataSource: {
			User: {
				StaffUser: {
					StaffUserReadRepo: {
						getByExternalId: vi.fn().mockResolvedValue(overrides.existingByExternalId ?? null),
						getByEmail: vi.fn().mockResolvedValue(overrides.existingByEmail ?? null),
					},
				},
			},
		},
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
	let command: StaffUserCreateCommand;
	let result: Domain.Contexts.User.StaffUser.StaffUserEntityReference | undefined;
	let thrownError: unknown;
	let newUser: MockStaffUserInstance;
	let staffRole: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null;

	BeforeEachScenario(() => {
		result = undefined;
		thrownError = undefined;
		newUser = makeMockNewUser('ext-123');
		staffRole = null;
		command = {
			externalId: 'ext-123',
			firstName: 'John',
			lastName: 'Doe',
			email: 'test@example.com',
		};
	});

	// ─── Create without role ──────────────────────────────────────────────────

	Scenario('Successfully creates a new staff user without a role', ({ Given, When, Then, And }) => {
		Given('no staff user with externalId "ext-123" exists', () => {
			newUser = makeMockNewUser('ext-123');
		});

		And('no staff user with email "test@example.com" exists', () => {
			// defaults: existingByExternalId null, existingByEmail null
		});

		And('no roleId is provided', () => {
			dataSources = makeDataSources({ newUser });
			command = { externalId: 'ext-123', firstName: 'John', lastName: 'Doe', email: 'test@example.com' };
		});

		When('I call create with externalId "ext-123", firstName "John", lastName "Doe", and email "test@example.com"', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('the new staff user should be saved', () => {
			const repo = dataSources._staffUserRepo as { save: ReturnType<typeof vi.fn> };
			expect(repo.save).toHaveBeenCalled();
		});

		And('the result should be the created staff user', () => {
			expect(thrownError).toBeUndefined();
			expect(result).toBeDefined();
			expect(result?.externalId).toBe('ext-123');
		});

		And('the user should have no role assigned', () => {
			expect(newUser.role).toBeUndefined();
		});
	});

	// ─── Create with role ─────────────────────────────────────────────────────

	Scenario('Successfully creates a new staff user with a role', ({ Given, When, Then, And }) => {
		Given('no staff user with externalId "ext-456" exists', () => {
			newUser = makeMockNewUser('ext-456');
		});

		And('no staff user with email "test@example.com" exists', () => {
			// defaults: existingByEmail null
		});

		And('a staff role with id "role-001" exists', () => {
			staffRole = makeMockStaffRoleRef('role-001');
			dataSources = makeDataSources({ newUser, staffRole });
			command = { externalId: 'ext-456', firstName: 'John', lastName: 'Doe', email: 'test@example.com', roleId: 'role-001' };
		});

		When('I call create with externalId "ext-456" and roleId "role-001"', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('the new staff user should be saved', () => {
			const repo = dataSources._staffUserRepo as { save: ReturnType<typeof vi.fn> };
			expect(repo.save).toHaveBeenCalled();
		});

		And('the result should be the created staff user', () => {
			expect(thrownError).toBeUndefined();
			expect(result).toBeDefined();
		});

		And('the user should have the role assigned', () => {
			expect(newUser.role).toBeDefined();
			expect(newUser.role?.id).toBe('role-001');
		});
	});

	// ─── Auto-generated externalId ────────────────────────────────────────────

	Scenario('Generates a UUID externalId when none is provided', ({ Given, When, Then, And }) => {
		Given('no staff user with email "test@example.com" exists', () => {
			newUser = makeMockNewUser('generated');
			dataSources = makeDataSources({ newUser });
			command = { firstName: 'John', lastName: 'Doe', email: 'test@example.com' };
		});

		And('no roleId is provided', () => {
			// already no roleId in command
		});

		When('I call create without an externalId', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('the new staff user should be saved with a generated externalId', () => {
			const repo = dataSources._staffUserRepo as { getNewInstance: ReturnType<typeof vi.fn> };
			expect(thrownError).toBeUndefined();
			// getNewInstance receives the auto-generated UUID (not undefined)
			expect(repo.getNewInstance).toHaveBeenCalled();
			const [calledExternalId] = (repo.getNewInstance as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
			expect(calledExternalId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
		});
	});

	// ─── Duplicate externalId ─────────────────────────────────────────────────

	Scenario('Throws when a staff user with the same externalId already exists', ({ Given, When, Then }) => {
		Given('a staff user with externalId "ext-dupe" already exists', () => {
			const existing = makeMockStaffUserRef('ext-dupe');
			dataSources = makeDataSources({ existingByExternalId: existing });
			command = { externalId: 'ext-dupe', firstName: 'John', lastName: 'Doe', email: 'test@example.com' };
		});

		When('I call create with externalId "ext-dupe"', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('it should throw an error with message containing "ext-dupe"', () => {
			expect(thrownError).toBeDefined();
			expect((thrownError as Error).message).toContain('ext-dupe');
		});
	});

	// ─── Duplicate email ──────────────────────────────────────────────────────

	Scenario('Throws when a staff user with the same email already exists', ({ Given, When, Then, And }) => {
		Given('no staff user with externalId "ext-789" exists', () => {
			// existingByExternalId will be null
		});

		And('a staff user with email "taken@example.com" already exists', () => {
			const existingByEmail = makeMockStaffUserRef('other-ext', { email: 'taken@example.com' });
			dataSources = makeDataSources({ existingByEmail });
			command = { externalId: 'ext-789', firstName: 'John', lastName: 'Doe', email: 'taken@example.com' };
		});

		When('I call create with externalId "ext-789" and email "taken@example.com"', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('it should throw an error with message containing "taken@example.com"', () => {
			expect(thrownError).toBeDefined();
			expect((thrownError as Error).message).toContain('taken@example.com');
		});
	});

	// ─── Save fails ───────────────────────────────────────────────────────────

	Scenario('Throws when repository fails to save the new user', ({ Given, When, Then, And }) => {
		Given('no staff user with externalId "ext-err" exists', () => {
			newUser = makeMockNewUser('ext-err');
		});

		And('no staff user with email "test@example.com" exists', () => {
			// existingByEmail null
		});

		And('no roleId is provided', () => {
			// no roleId
		});

		And('saving the staff user returns undefined', () => {
			dataSources = makeDataSources({ newUser, explicitUndefinedSave: true });
			command = { externalId: 'ext-err', firstName: 'John', lastName: 'Doe', email: 'test@example.com' };
		});

		When('I call create with externalId "ext-err"', async () => {
			try {
				result = await create(dataSources)(command);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('it should throw an error with message "Unable to create staff user"', () => {
			expect(thrownError).toBeDefined();
			expect((thrownError as Error).message).toBe('Unable to create staff user');
		});
	});
});
