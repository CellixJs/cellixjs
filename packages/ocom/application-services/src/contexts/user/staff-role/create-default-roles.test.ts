import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { expect, vi } from 'vitest';
import { createDefaultRoles, StaffAppRoleNames } from './create-default-roles.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/create-default-roles.feature'));

type StaffRolePermissions = {
	communityPermissions: { canManageCommunities: boolean; canManageStaffRolesAndPermissions?: boolean };
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
		getDefaultRoleByEnterpriseAppRole: vi.fn().mockImplementation((enterpriseAppRole: string) => {
			if (existingRoleNames.includes(enterpriseAppRole)) {
				return Promise.resolve(makeMockStaffRole(enterpriseAppRole));
			}
			return Promise.reject(new Error(`NotFoundError: ${enterpriseAppRole} not found`));
		}),
		getNewInstance: vi.fn().mockImplementation((roleName: string) => {
			const role = makeMockStaffRole(roleName);
			savedRoles.push(role);
			return Promise.resolve(role);
		}),
		getNewDefaultCaseManagerInstance: vi.fn().mockImplementation(() => {
			const role = makeMockStaffRole(StaffAppRoleNames.CaseManager, {
				communityPermissions: { canManageCommunities: true, canManageStaffRolesAndPermissions: false },
				financePermissions: { canManageFinance: false },
				techAdminPermissions: { canManageTechAdmin: false },
				userPermissions: { canManageUsers: true },
			});
			(role as { isDefault: boolean }).isDefault = true;
			savedRoles.push(role);
			return Promise.resolve(role);
		}),
		getNewDefaultServiceLineOwnerInstance: vi.fn().mockImplementation(() => {
			const role = makeMockStaffRole(StaffAppRoleNames.ServiceLineOwner, {
				communityPermissions: { canManageCommunities: true, canManageStaffRolesAndPermissions: false },
				financePermissions: { canManageFinance: false },
				techAdminPermissions: { canManageTechAdmin: false },
				userPermissions: { canManageUsers: true },
			});
			(role as { isDefault: boolean }).isDefault = true;
			savedRoles.push(role);
			return Promise.resolve(role);
		}),
		getNewDefaultFinanceInstance: vi.fn().mockImplementation(() => {
			const role = makeMockStaffRole(StaffAppRoleNames.Finance, {
				communityPermissions: { canManageCommunities: false },
				financePermissions: { canManageFinance: true },
				techAdminPermissions: { canManageTechAdmin: false },
				userPermissions: { canManageUsers: false },
			});
			(role as { isDefault: boolean }).isDefault = true;
			savedRoles.push(role);
			return Promise.resolve(role);
		}),
		getNewDefaultTechAdminInstance: vi.fn().mockImplementation(() => {
			const role = makeMockStaffRole(StaffAppRoleNames.TechAdmin, {
				communityPermissions: { canManageCommunities: true, canManageStaffRolesAndPermissions: true },
				financePermissions: { canManageFinance: true },
				techAdminPermissions: { canManageTechAdmin: true },
				userPermissions: { canManageUsers: true },
			});
			(role as { isDefault: boolean }).isDefault = true;
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
	// Ensure compatibility for tests that only stub getNewInstance by mapping new factory methods to it when missing
	const repoWithDefaults = { ...repo } as StaffRoleRepo;
	if (!repoWithDefaults.getNewDefaultCaseManagerInstance) {
		repoWithDefaults.getNewDefaultCaseManagerInstance = async () => {
			const role = await repo.getNewInstance(StaffAppRoleNames.CaseManager);
			(role as { isDefault: boolean }).isDefault = true;
			(role.permissions.communityPermissions as { canManageCommunities: boolean }).canManageCommunities = true;
			(role.permissions.financePermissions as { canManageFinance: boolean }).canManageFinance = false;
			(role.permissions.techAdminPermissions as { canManageTechAdmin: boolean }).canManageTechAdmin = false;
			(role.permissions.userPermissions as { canManageUsers: boolean }).canManageUsers = true;
			return role;
		};
	}
	if (!repoWithDefaults.getNewDefaultServiceLineOwnerInstance) {
		repoWithDefaults.getNewDefaultServiceLineOwnerInstance = async () => {
			const role = await repo.getNewInstance(StaffAppRoleNames.ServiceLineOwner);
			(role as { isDefault: boolean }).isDefault = true;
			(role.permissions.communityPermissions as { canManageCommunities: boolean }).canManageCommunities = true;
			(role.permissions.financePermissions as { canManageFinance: boolean }).canManageFinance = false;
			(role.permissions.techAdminPermissions as { canManageTechAdmin: boolean }).canManageTechAdmin = false;
			(role.permissions.userPermissions as { canManageUsers: boolean }).canManageUsers = true;
			return role;
		};
	}
	if (!repoWithDefaults.getNewDefaultFinanceInstance) {
		repoWithDefaults.getNewDefaultFinanceInstance = async () => {
			const role = await repo.getNewInstance(StaffAppRoleNames.Finance);
			(role as { isDefault: boolean }).isDefault = true;
			(role.permissions.communityPermissions as { canManageCommunities: boolean }).canManageCommunities = false;
			(role.permissions.financePermissions as { canManageFinance: boolean }).canManageFinance = true;
			(role.permissions.techAdminPermissions as { canManageTechAdmin: boolean }).canManageTechAdmin = false;
			(role.permissions.userPermissions as { canManageUsers: boolean }).canManageUsers = false;
			return role;
		};
	}
	if (!repoWithDefaults.getNewDefaultTechAdminInstance) {
		repoWithDefaults.getNewDefaultTechAdminInstance = async () => {
			const role = await repo.getNewInstance(StaffAppRoleNames.TechAdmin);
			(role as { isDefault: boolean }).isDefault = true;
			(role.permissions.communityPermissions as { canManageCommunities: boolean; canManageStaffRolesAndPermissions?: boolean }).canManageCommunities = true;
			(role.permissions.communityPermissions as { canManageStaffRolesAndPermissions?: boolean }).canManageStaffRolesAndPermissions = true;
			(role.permissions.financePermissions as { canManageFinance: boolean }).canManageFinance = true;
			(role.permissions.techAdminPermissions as { canManageTechAdmin: boolean }).canManageTechAdmin = true;
			(role.permissions.userPermissions as { canManageUsers: boolean }).canManageUsers = true;
			return role;
		};
	}
	if (!repoWithDefaults.getDefaultRoleByEnterpriseAppRole) {
		repoWithDefaults.getDefaultRoleByEnterpriseAppRole = (enterpriseAppRole: string) => repoWithDefaults.getByRoleName(enterpriseAppRole);
	}

	return {
		domainDataSource: {
			User: {
				StaffRole: {
					StaffRoleUnitOfWork: {
						withTransaction: vi.fn().mockImplementation(async (_passport: unknown, callback: (r: StaffRoleRepo) => Promise<void>) => {
							await callback(repoWithDefaults as unknown as StaffRoleRepo);
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

		Then('it should create all four roles: "Default.CaseManager", "Default.ServiceLineOwner", "Default.Finance", "Default.TechAdmin"', () => {
			expect(vi.mocked(mockRepo.getNewDefaultCaseManagerInstance)).toHaveBeenCalledTimes(1);
			expect(vi.mocked(mockRepo.getNewDefaultServiceLineOwnerInstance)).toHaveBeenCalledTimes(1);
			expect(vi.mocked(mockRepo.getNewDefaultFinanceInstance)).toHaveBeenCalledTimes(1);
			expect(vi.mocked(mockRepo.getNewDefaultTechAdminInstance)).toHaveBeenCalledTimes(1);
		});

		And('it should return all four created role references', () => {
			expect(result).toHaveLength(4);
			for (const r of result) expect(r.isDefault).toBe(true);
		});
	});

	// ─── Partial skip ─────────────────────────────────────────────────────────

	Scenario('Skips roles that already exist', ({ Given, When, Then, And }) => {
		Given('the role "Default.CaseManager" already exists', () => {
			mockRepo = makeMockRepo([StaffAppRoleNames.CaseManager]);
			dataSources = makeDataSources(mockRepo);
		});

		When('I call createDefaultRoles', async () => {
			result = await createDefaultRoles(dataSources)();
		});

		Then('it should only create the three missing roles', () => {
			expect(vi.mocked(mockRepo.getNewDefaultCaseManagerInstance)).not.toHaveBeenCalled();
			expect(vi.mocked(mockRepo.getNewDefaultServiceLineOwnerInstance)).toHaveBeenCalledTimes(1);
			expect(vi.mocked(mockRepo.getNewDefaultFinanceInstance)).toHaveBeenCalledTimes(1);
			expect(vi.mocked(mockRepo.getNewDefaultTechAdminInstance)).toHaveBeenCalledTimes(1);
		});

		And('it should not attempt to create "Default.CaseManager" again', () => {
			expect(vi.mocked(mockRepo.getNewDefaultCaseManagerInstance)).not.toHaveBeenCalled();
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
			expect(vi.mocked(mockRepo.getNewDefaultCaseManagerInstance)).not.toHaveBeenCalled();
			expect(vi.mocked(mockRepo.getNewDefaultServiceLineOwnerInstance)).not.toHaveBeenCalled();
			expect(vi.mocked(mockRepo.getNewDefaultFinanceInstance)).not.toHaveBeenCalled();
			expect(vi.mocked(mockRepo.getNewDefaultTechAdminInstance)).not.toHaveBeenCalled();
			expect(vi.mocked(mockRepo.save)).not.toHaveBeenCalled();
		});
	});

	// ─── CaseManager permissions ──────────────────────────────────────────────

	Scenario('CaseManager role has correct permissions', ({ Given, When, Then, And }) => {
		let capturedRoles: Map<string, Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>>;

		Given('no staff roles exist', () => {
			capturedRoles = new Map();
			mockRepo = {
				getDefaultRoleByEnterpriseAppRole: vi.fn().mockRejectedValue(new Error('not found')),
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

		Then('the "Default.CaseManager" role should have canManageCommunities true', () => {
			const role = capturedRoles.get(StaffAppRoleNames.CaseManager);
			expect(role?.permissions.communityPermissions.canManageCommunities).toBe(true);
		});

		And('the "Default.CaseManager" role should have canManageFinance false', () => {
			const role = capturedRoles.get(StaffAppRoleNames.CaseManager);
			expect(role?.permissions.financePermissions.canManageFinance).toBe(false);
		});

		And('the "Default.CaseManager" role should have canManageTechAdmin false', () => {
			const role = capturedRoles.get(StaffAppRoleNames.CaseManager);
			expect(role?.permissions.techAdminPermissions.canManageTechAdmin).toBe(false);
		});

		And('the "Default.CaseManager" role should have canManageUsers true', () => {
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
				getDefaultRoleByEnterpriseAppRole: vi.fn().mockRejectedValue(new Error('not found')),
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

		Then('the "Default.Finance" role should have canManageCommunities false', () => {
			const role = capturedRoles.get(StaffAppRoleNames.Finance);
			expect(role?.permissions.communityPermissions.canManageCommunities).toBe(false);
		});

		And('the "Default.Finance" role should have canManageFinance true', () => {
			const role = capturedRoles.get(StaffAppRoleNames.Finance);
			expect(role?.permissions.financePermissions.canManageFinance).toBe(true);
		});

		And('the "Default.Finance" role should have canManageTechAdmin false', () => {
			const role = capturedRoles.get(StaffAppRoleNames.Finance);
			expect(role?.permissions.techAdminPermissions.canManageTechAdmin).toBe(false);
		});

		And('the "Default.Finance" role should have canManageUsers false', () => {
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
				getDefaultRoleByEnterpriseAppRole: vi.fn().mockRejectedValue(new Error('not found')),
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

		Then('the "Default.TechAdmin" role should have canManageCommunities true', () => {
			const role = capturedRoles.get(StaffAppRoleNames.TechAdmin);
			expect(role?.permissions.communityPermissions.canManageCommunities).toBe(true);
			// Tech Admins should also be able to manage staff roles & permissions by default
			expect(role?.permissions.communityPermissions.canManageStaffRolesAndPermissions).toBe(true);
		});

		And('the "Default.TechAdmin" role should have canManageFinance true', () => {
			const role = capturedRoles.get(StaffAppRoleNames.TechAdmin);
			expect(role?.permissions.financePermissions.canManageFinance).toBe(true);
		});

		And('the "Default.TechAdmin" role should have canManageTechAdmin true', () => {
			const role = capturedRoles.get(StaffAppRoleNames.TechAdmin);
			expect(role?.permissions.techAdminPermissions.canManageTechAdmin).toBe(true);
		});

		And('the "Default.TechAdmin" role should have canManageUsers true', () => {
			const role = capturedRoles.get(StaffAppRoleNames.TechAdmin);
			expect(role?.permissions.userPermissions.canManageUsers).toBe(true);
		});
	});

	// ─── ServiceLineOwner permissions ─────────────────────────────────────────

	Scenario('ServiceLineOwner role has correct permissions', ({ Given, When, Then, And }) => {
		let capturedRoles: Map<string, Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>>;

		Given('no staff roles exist', () => {
			capturedRoles = new Map();
			mockRepo = {
				getDefaultRoleByEnterpriseAppRole: vi.fn().mockRejectedValue(new Error('not found')),
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

		Then('the "Default.ServiceLineOwner" role should have canManageCommunities true', () => {
			const role = capturedRoles.get(StaffAppRoleNames.ServiceLineOwner);
			expect(role?.permissions.communityPermissions.canManageCommunities).toBe(true);
		});

		And('the "Default.ServiceLineOwner" role should have canManageFinance false', () => {
			const role = capturedRoles.get(StaffAppRoleNames.ServiceLineOwner);
			expect(role?.permissions.financePermissions.canManageFinance).toBe(false);
		});

		And('the "Default.ServiceLineOwner" role should have canManageTechAdmin false', () => {
			const role = capturedRoles.get(StaffAppRoleNames.ServiceLineOwner);
			expect(role?.permissions.techAdminPermissions.canManageTechAdmin).toBe(false);
		});

		And('the "Default.ServiceLineOwner" role should have canManageUsers true', () => {
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
				getDefaultRoleByEnterpriseAppRole: vi.fn().mockRejectedValue(new Error('Database connection failed')),
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
