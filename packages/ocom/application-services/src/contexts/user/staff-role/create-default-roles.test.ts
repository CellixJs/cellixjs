import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { expect, vi } from 'vitest';
import { StaffAppRoleNames, createDefaultRoles } from './create-default-roles.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/create-default-roles.feature'));

type StaffRolePermissions = {
	communityPermissions: { canManageCommunities: boolean };
	financePermissions: { canManageFinance: boolean };
	techAdminPermissions: { canManageTechAdmin: boolean };
	userPermissions: { canManageUsers: boolean };
};

function makeMockStaffRole(
	roleName: string,
	permissions: StaffRolePermissions = {
		communityPermissions: { canManageCommunities: false },
		financePermissions: { canManageFinance: false },
		techAdminPermissions: { canManageTechAdmin: false },
		userPermissions: { canManageUsers: false },
	},
): Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps> {
	return {
		id: `id-${roleName}`,
		roleName,
		isDefault: false,
		permissions,
		roleType: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		schemaVersion: '1.0',
	} as unknown as Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>;
}

function makeMockRepo(existingRoleNames: string[] = [], overrides: Partial<StaffRoleRepo> = {}): StaffRoleRepo {
	const savedRoles: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>[] = [];

	return {
		// biome-ignore lint/suspicious/noExplicitAny: test helper captures saved roles for inspection
		_savedRoles: savedRoles as any,
		getByRoleName: vi.fn().mockImplementation((roleName: string) => {
			if (existingRoleNames.includes(roleName)) {
				return Promise.resolve(makeMockStaffRole(roleName));
			}
			return Promise.reject(new Error(`NotFoundError: ${roleName} not found`));
		}),
		getNewInstance: vi.fn().mockImplementation((roleName: string) => {
			const role = makeMockStaffRole(roleName);
			savedRoles.push(role);
			return Promise.resolve(role);
		}),
		save: vi.fn().mockImplementation((role: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>) => {
			return Promise.resolve(role as Domain.Contexts.User.StaffRole.StaffRoleEntityReference);
		}),
		...overrides,
	} as unknown as StaffRoleRepo;
}

type StaffRoleRepo = Domain.Contexts.User.StaffRole.StaffRoleRepository<Domain.Contexts.User.StaffRole.StaffRoleProps>;

function makeDataSources(repo: StaffRoleRepo): DataSources {
	return {
		domainDataSource: {
			User: {
				StaffRole: {
					StaffRoleUnitOfWork: {
						withScopedTransaction: vi.fn().mockImplementation(async (callback: (r: StaffRoleRepo) => Promise<void>) => {
							await callback(repo);
						}),
					},
				},
			},
		},
	} as unknown as DataSources;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let dataSources: DataSources;
	let mockRepo: StaffRoleRepo;
	let result: Domain.Contexts.User.StaffRole.StaffRoleEntityReference[];

	BeforeEachScenario(() => {
		result = [];
		mockRepo = undefined as unknown as typeof mockRepo;
		dataSources = undefined as unknown as DataSources;
	});

	// ─── All four missing ──────────────────────────────────────────────────────

	Scenario('Creates all four default roles when none exist', ({ Given, When, Then, And }) => {
		Given('no staff roles exist', () => {
			mockRepo = makeMockRepo([]);
			dataSources = makeDataSources(mockRepo);
		});

		When('I call createDefaultRoles', async () => {
			result = await createDefaultRoles(dataSources)();
		});

		Then('it should create all four roles: "Staff.CaseManager", "Staff.ServiceLineOwner", "Staff.Finance", "Staff.TechAdmin"', () => {
			expect(vi.mocked(mockRepo.getNewInstance)).toHaveBeenCalledTimes(4);
			const names = vi.mocked(mockRepo.getNewInstance).mock.calls.map(([n]) => n);
			expect(names).toContain(StaffAppRoleNames.CaseManager);
			expect(names).toContain(StaffAppRoleNames.ServiceLineOwner);
			expect(names).toContain(StaffAppRoleNames.Finance);
			expect(names).toContain(StaffAppRoleNames.TechAdmin);
		});

		And('it should return all four created role references', () => {
			expect(result).toHaveLength(4);
			for (const r of result) expect(r.isDefault).toBe(true);
		});
	});

	// ─── Partial skip ─────────────────────────────────────────────────────────

	Scenario('Skips roles that already exist', ({ Given, When, Then, And }) => {
		Given('the role "Staff.CaseManager" already exists', () => {
			mockRepo = makeMockRepo([StaffAppRoleNames.CaseManager]);
			dataSources = makeDataSources(mockRepo);
		});

		When('I call createDefaultRoles', async () => {
			result = await createDefaultRoles(dataSources)();
		});

		Then('it should only create the three missing roles', () => {
			expect(vi.mocked(mockRepo.getNewInstance)).toHaveBeenCalledTimes(3);
		});

		And('it should not attempt to create "Staff.CaseManager" again', () => {
			const names = vi.mocked(mockRepo.getNewInstance).mock.calls.map(([n]) => n);
			expect(names).not.toContain(StaffAppRoleNames.CaseManager);
		});
	});

	// ─── All exist ────────────────────────────────────────────────────────────

	Scenario('Returns empty array when all roles already exist', ({ Given, When, Then, And }) => {
		Given('all four default roles already exist', () => {
			mockRepo = makeMockRepo(Object.values(StaffAppRoleNames));
			dataSources = makeDataSources(mockRepo);
		});

		When('I call createDefaultRoles', async () => {
			result = await createDefaultRoles(dataSources)();
		});

		Then('it should return an empty array', () => {
			expect(result).toHaveLength(0);
		});

		And('it should not call getNewInstance or save', () => {
			expect(vi.mocked(mockRepo.getNewInstance)).not.toHaveBeenCalled();
			expect(vi.mocked(mockRepo.save)).not.toHaveBeenCalled();
		});
	});

	// ─── CaseManager permissions ──────────────────────────────────────────────

	Scenario('CaseManager role has correct permissions', ({ Given, When, Then, And }) => {
		let capturedRoles: Map<string, Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>>;

		Given('no staff roles exist', () => {
			capturedRoles = new Map();
			mockRepo = {
				getByRoleName: vi.fn().mockRejectedValue(new Error('not found')),
				getNewInstance: vi.fn().mockImplementation((roleName: string) => {
					const role = makeMockStaffRole(roleName);
					capturedRoles.set(roleName, role);
					return Promise.resolve(role);
				}),
				save: vi.fn().mockImplementation((role: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>) => Promise.resolve(role as Domain.Contexts.User.StaffRole.StaffRoleEntityReference)),
			} as unknown as typeof mockRepo;
			dataSources = makeDataSources(mockRepo);
		});

		When('I call createDefaultRoles', async () => {
			await createDefaultRoles(dataSources)();
		});

		Then('the "Staff.CaseManager" role should have canManageCommunities true', () => {
			const role = capturedRoles.get(StaffAppRoleNames.CaseManager);
			expect(role?.permissions.communityPermissions.canManageCommunities).toBe(true);
		});

		And('the "Staff.CaseManager" role should have canManageFinance false', () => {
			const role = capturedRoles.get(StaffAppRoleNames.CaseManager);
			expect(role?.permissions.financePermissions.canManageFinance).toBe(false);
		});

		And('the "Staff.CaseManager" role should have canManageTechAdmin false', () => {
			const role = capturedRoles.get(StaffAppRoleNames.CaseManager);
			expect(role?.permissions.techAdminPermissions.canManageTechAdmin).toBe(false);
		});

		And('the "Staff.CaseManager" role should have canManageUsers true', () => {
			const role = capturedRoles.get(StaffAppRoleNames.CaseManager);
			expect(role?.permissions.userPermissions.canManageUsers).toBe(true);
		});
	});

	// ─── Finance permissions ──────────────────────────────────────────────────

	Scenario('Finance role has correct permissions', ({ Given, When, Then, And }) => {
		let capturedRoles: Map<string, Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>>;

		Given('no staff roles exist', () => {
			capturedRoles = new Map();
			mockRepo = {
				getByRoleName: vi.fn().mockRejectedValue(new Error('not found')),
				getNewInstance: vi.fn().mockImplementation((roleName: string) => {
					const role = makeMockStaffRole(roleName);
					capturedRoles.set(roleName, role);
					return Promise.resolve(role);
				}),
				save: vi.fn().mockImplementation((role: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>) => Promise.resolve(role as Domain.Contexts.User.StaffRole.StaffRoleEntityReference)),
			} as unknown as typeof mockRepo;
			dataSources = makeDataSources(mockRepo);
		});

		When('I call createDefaultRoles', async () => {
			await createDefaultRoles(dataSources)();
		});

		Then('the "Staff.Finance" role should have canManageCommunities false', () => {
			const role = capturedRoles.get(StaffAppRoleNames.Finance);
			expect(role?.permissions.communityPermissions.canManageCommunities).toBe(false);
		});

		And('the "Staff.Finance" role should have canManageFinance true', () => {
			const role = capturedRoles.get(StaffAppRoleNames.Finance);
			expect(role?.permissions.financePermissions.canManageFinance).toBe(true);
		});

		And('the "Staff.Finance" role should have canManageTechAdmin false', () => {
			const role = capturedRoles.get(StaffAppRoleNames.Finance);
			expect(role?.permissions.techAdminPermissions.canManageTechAdmin).toBe(false);
		});

		And('the "Staff.Finance" role should have canManageUsers false', () => {
			const role = capturedRoles.get(StaffAppRoleNames.Finance);
			expect(role?.permissions.userPermissions.canManageUsers).toBe(false);
		});
	});

	// ─── TechAdmin permissions ────────────────────────────────────────────────

	Scenario('TechAdmin role has correct permissions', ({ Given, When, Then, And }) => {
		let capturedRoles: Map<string, Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>>;

		Given('no staff roles exist', () => {
			capturedRoles = new Map();
			mockRepo = {
				getByRoleName: vi.fn().mockRejectedValue(new Error('not found')),
				getNewInstance: vi.fn().mockImplementation((roleName: string) => {
					const role = makeMockStaffRole(roleName);
					capturedRoles.set(roleName, role);
					return Promise.resolve(role);
				}),
				save: vi.fn().mockImplementation((role: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>) => Promise.resolve(role as Domain.Contexts.User.StaffRole.StaffRoleEntityReference)),
			} as unknown as typeof mockRepo;
			dataSources = makeDataSources(mockRepo);
		});

		When('I call createDefaultRoles', async () => {
			await createDefaultRoles(dataSources)();
		});

		Then('the "Staff.TechAdmin" role should have canManageCommunities false', () => {
			const role = capturedRoles.get(StaffAppRoleNames.TechAdmin);
			expect(role?.permissions.communityPermissions.canManageCommunities).toBe(false);
		});

		And('the "Staff.TechAdmin" role should have canManageFinance false', () => {
			const role = capturedRoles.get(StaffAppRoleNames.TechAdmin);
			expect(role?.permissions.financePermissions.canManageFinance).toBe(false);
		});

		And('the "Staff.TechAdmin" role should have canManageTechAdmin true', () => {
			const role = capturedRoles.get(StaffAppRoleNames.TechAdmin);
			expect(role?.permissions.techAdminPermissions.canManageTechAdmin).toBe(true);
		});

		And('the "Staff.TechAdmin" role should have canManageUsers false', () => {
			const role = capturedRoles.get(StaffAppRoleNames.TechAdmin);
			expect(role?.permissions.userPermissions.canManageUsers).toBe(false);
		});
	});

	// ─── ServiceLineOwner permissions ─────────────────────────────────────────

	Scenario('ServiceLineOwner role has correct permissions', ({ Given, When, Then, And }) => {
		let capturedRoles: Map<string, Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>>;

		Given('no staff roles exist', () => {
			capturedRoles = new Map();
			mockRepo = {
				getByRoleName: vi.fn().mockRejectedValue(new Error('not found')),
				getNewInstance: vi.fn().mockImplementation((roleName: string) => {
					const role = makeMockStaffRole(roleName);
					capturedRoles.set(roleName, role);
					return Promise.resolve(role);
				}),
				save: vi.fn().mockImplementation((role: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>) => Promise.resolve(role as Domain.Contexts.User.StaffRole.StaffRoleEntityReference)),
			} as unknown as typeof mockRepo;
			dataSources = makeDataSources(mockRepo);
		});

		When('I call createDefaultRoles', async () => {
			await createDefaultRoles(dataSources)();
		});

		Then('the "Staff.ServiceLineOwner" role should have canManageCommunities true', () => {
			const role = capturedRoles.get(StaffAppRoleNames.ServiceLineOwner);
			expect(role?.permissions.communityPermissions.canManageCommunities).toBe(true);
		});

		And('the "Staff.ServiceLineOwner" role should have canManageFinance false', () => {
			const role = capturedRoles.get(StaffAppRoleNames.ServiceLineOwner);
			expect(role?.permissions.financePermissions.canManageFinance).toBe(false);
		});

		And('the "Staff.ServiceLineOwner" role should have canManageTechAdmin false', () => {
			const role = capturedRoles.get(StaffAppRoleNames.ServiceLineOwner);
			expect(role?.permissions.techAdminPermissions.canManageTechAdmin).toBe(false);
		});

		And('the "Staff.ServiceLineOwner" role should have canManageUsers true', () => {
			const role = capturedRoles.get(StaffAppRoleNames.ServiceLineOwner);
			expect(role?.permissions.userPermissions.canManageUsers).toBe(true);
		});
	});

	// ─── isDefault false ──────────────────────────────────────────────────────

	Scenario('All created roles have isDefault set to true', ({ Given, When, Then }) => {
		Given('no staff roles exist', () => {
			mockRepo = makeMockRepo([]);
			dataSources = makeDataSources(mockRepo);
		});

		When('I call createDefaultRoles', async () => {
			result = await createDefaultRoles(dataSources)();
		});

		Then('all created roles should have isDefault true', () => {
			for (const role of result) {
				expect(role.isDefault).toBe(true);
			}
		});
	});

	// ─── Error propagation ────────────────────────────────────────────────────

	Scenario('Propagates unexpected repository errors', ({ Given, When, Then }) => {
		let thrownError: unknown;

		Given('no staff roles exist', () => {
			mockRepo = {
				getByRoleName: vi.fn().mockRejectedValue(new Error('Database connection failed')),
				getNewInstance: vi.fn(),
				save: vi.fn(),
			} as unknown as typeof mockRepo;
			dataSources = makeDataSources(mockRepo);
		});

		When('the repository throws an unexpected error', async () => {
			try {
				await createDefaultRoles(dataSources)();
			} catch (error) {
				thrownError = error;
			}
		});

		Then('createDefaultRoles should propagate the error', () => {
			expect(thrownError).toBeInstanceOf(Error);
			expect((thrownError as Error).message).toBe('Database connection failed');
		});
	});
});
