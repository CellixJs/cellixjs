import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { Passport } from '../../passport.ts';
import type { StaffRoleRepository } from './staff-role.repository.ts';
import { StaffRole, type StaffRoleEntityReference, type StaffRoleProps } from './staff-role.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/staff-role.repository.feature'));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePassport(): Passport {
	return {
		user: {
			forStaffRole: () => ({
				determineIf: (fn: (p: { canManageStaffRolesAndPermissions: boolean; isSystemAccount: boolean }) => boolean) => fn({ canManageStaffRolesAndPermissions: true, isSystemAccount: false }),
			}),
		},
	} as unknown as Passport;
}

function makeBaseProps(overrides: Partial<StaffRoleProps> = {}): StaffRoleProps {
	return {
		id: 'role-1',
		roleName: 'Support',
		isDefault: false,
		enterpriseAppRole: '',
		permissions: {
			communityPermissions: {
				canManageCommunities: false,
				canManageStaffRolesAndPermissions: false,
				canManageAllCommunities: false,
				canDeleteCommunities: false,
				canChangeCommunityOwner: false,
				canReIndexSearchCollections: false,
			},
			propertyPermissions: { canManageProperties: false, canEditOwnProperty: false },
			servicePermissions: { canManageServices: false },
			serviceTicketPermissions: { canCreateTickets: false, canManageTickets: false, canAssignTickets: false, canWorkOnTickets: false },
			violationTicketPermissions: { canCreateTickets: false, canManageTickets: false, canAssignTickets: false, canWorkOnTickets: false },
			financePermissions: { canManageFinance: false, canViewGLBatchSummaries: false, canViewFinanceConfigs: false, canCreateFinanceConfigs: false },
			techAdminPermissions: { canManageTechAdmin: false },
			userPermissions: { canManageUsers: false },
		} as unknown as StaffRoleProps['permissions'],
		roleType: 'staff-role',
		createdAt: new Date(),
		updatedAt: new Date(),
		schemaVersion: '1.0',
		...overrides,
	};
}

/**
 * Factory that builds a mock StaffRoleRepository whose methods delegate to
 * actual StaffRole static factory methods, satisfying the full interface contract.
 */
function makeMockRepository(passport: Passport): StaffRoleRepository<StaffRoleProps> {
	return {
		// From Repository<StaffRole<StaffRoleProps>>
		get: vi.fn(async (id: string) => new StaffRole(makeBaseProps({ id }), passport)),
		save: vi.fn(async (item: StaffRole<StaffRoleProps>) => item),

		// Domain-specific methods
		getNewInstance: vi.fn(async (name: string) => StaffRole.getNewInstance(makeBaseProps({ roleName: name }), passport, name, false)),
		getNewDefaultCaseManagerInstance: vi.fn(async () => StaffRole.getNewDefaultCaseManagerInstance(makeBaseProps({ roleName: 'Default.CaseManager', isDefault: true }), passport)),
		getNewDefaultServiceLineOwnerInstance: vi.fn(async () => StaffRole.getNewDefaultServiceLineOwnerInstance(makeBaseProps({ roleName: 'Default.ServiceLineOwner', isDefault: true }), passport)),
		getNewDefaultFinanceInstance: vi.fn(async () => StaffRole.getNewDefaultFinanceInstance(makeBaseProps({ roleName: 'Default.Finance', isDefault: true }), passport)),
		getNewDefaultTechAdminInstance: vi.fn(async () => StaffRole.getNewDefaultTechAdminInstance(makeBaseProps({ roleName: 'Default.TechAdmin', isDefault: true }), passport)),
		getById: vi.fn(async (id: string) => new StaffRole(makeBaseProps({ id }), passport)),
		getByRoleName: vi.fn(async (roleName: string) => new StaffRole(makeBaseProps({ roleName }), passport)),
		getDefaultRoleByEnterpriseAppRole: vi.fn(async (enterpriseAppRole: string) => new StaffRole(makeBaseProps({ enterpriseAppRole, isDefault: true }), passport)),
	} satisfies StaffRoleRepository<StaffRoleProps>;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let passport: Passport;
	let repo: StaffRoleRepository<StaffRoleProps>;
	let result: StaffRole<StaffRoleProps> | StaffRoleEntityReference | undefined;

	BeforeEachScenario(() => {
		passport = makePassport();
		repo = makeMockRepository(passport);
		result = undefined;
	});

	Background(({ Given }) => {
		Given('a mock implementation of StaffRoleRepository that satisfies the full interface', () => {
			// repo already initialised in BeforeEachScenario
		});
	});

	// ─── getNewInstance ───────────────────────────────────────────────────────

	Scenario('getNewInstance resolves with a StaffRole for the given name', ({ When, Then, And }) => {
		When('I call getNewInstance with name "Supervisor"', async () => {
			result = await repo.getNewInstance('Supervisor');
		});
		Then('it should resolve with a StaffRole whose roleName is "Supervisor"', () => {
			expect(result).toBeDefined();
			expect((result as StaffRoleEntityReference).roleName).toBe('Supervisor');
		});
		And('the StaffRole isDefault should be false', () => {
			expect((result as StaffRoleEntityReference).isDefault).toBe(false);
		});
	});

	// ─── getNewDefaultCaseManagerInstance ────────────────────────────────────

	Scenario('getNewDefaultCaseManagerInstance resolves with a default CaseManager role', ({ When, Then, And }) => {
		When('I call getNewDefaultCaseManagerInstance', async () => {
			result = await repo.getNewDefaultCaseManagerInstance();
		});
		Then('it should resolve with a StaffRole whose roleName is "Default Case Manager"', () => {
			expect((result as StaffRoleEntityReference).roleName).toBe('Default Case Manager');
		});
		And('the StaffRole isDefault should be true', () => {
			expect((result as StaffRoleEntityReference).isDefault).toBe(true);
		});
	});

	// ─── getNewDefaultServiceLineOwnerInstance ────────────────────────────────

	Scenario('getNewDefaultServiceLineOwnerInstance resolves with a default ServiceLineOwner role', ({ When, Then, And }) => {
		When('I call getNewDefaultServiceLineOwnerInstance', async () => {
			result = await repo.getNewDefaultServiceLineOwnerInstance();
		});
		Then('it should resolve with a StaffRole whose roleName is "Default Service Line Owner"', () => {
			expect((result as StaffRoleEntityReference).roleName).toBe('Default Service Line Owner');
		});
		And('the StaffRole isDefault should be true', () => {
			expect((result as StaffRoleEntityReference).isDefault).toBe(true);
		});
	});

	// ─── getNewDefaultFinanceInstance ────────────────────────────────────────

	Scenario('getNewDefaultFinanceInstance resolves with a default Finance role', ({ When, Then, And }) => {
		When('I call getNewDefaultFinanceInstance', async () => {
			result = await repo.getNewDefaultFinanceInstance();
		});
		Then('it should resolve with a StaffRole whose roleName is "Default Finance"', () => {
			expect((result as StaffRoleEntityReference).roleName).toBe('Default Finance');
		});
		And('the StaffRole isDefault should be true', () => {
			expect((result as StaffRoleEntityReference).isDefault).toBe(true);
		});
	});

	// ─── getNewDefaultTechAdminInstance ──────────────────────────────────────

	Scenario('getNewDefaultTechAdminInstance resolves with a default TechAdmin role', ({ When, Then, And }) => {
		When('I call getNewDefaultTechAdminInstance', async () => {
			result = await repo.getNewDefaultTechAdminInstance();
		});
		Then('it should resolve with a StaffRole whose roleName is "Default Tech Admin"', () => {
			expect((result as StaffRoleEntityReference).roleName).toBe('Default Tech Admin');
		});
		And('the StaffRole isDefault should be true', () => {
			expect((result as StaffRoleEntityReference).isDefault).toBe(true);
		});
	});

	// ─── getById ─────────────────────────────────────────────────────────────

	Scenario('getById resolves with a StaffRole for a known id', ({ When, Then }) => {
		When('I call getById with "role-1"', async () => {
			result = await repo.getById('role-1');
		});
		Then('it should resolve with a StaffRole whose id is "role-1"', () => {
			expect((result as StaffRoleEntityReference).id).toBe('role-1');
		});
	});

	// ─── getByRoleName ────────────────────────────────────────────────────────

	Scenario('getByRoleName resolves with a StaffRole for a known roleName', ({ When, Then }) => {
		When('I call getByRoleName with "Manager"', async () => {
			result = await repo.getByRoleName('Manager');
		});
		Then('it should resolve with a StaffRole whose roleName is "Manager"', () => {
			expect((result as StaffRoleEntityReference).roleName).toBe('Manager');
		});
	});

	// ─── getDefaultRoleByEnterpriseAppRole ────────────────────────────────────

	Scenario('getDefaultRoleByEnterpriseAppRole resolves with a default StaffRole', ({ When, Then }) => {
		When('I call getDefaultRoleByEnterpriseAppRole with "Staff.CaseManager"', async () => {
			result = await repo.getDefaultRoleByEnterpriseAppRole('Staff.CaseManager');
		});
		Then('it should resolve with a StaffRole whose isDefault is true', () => {
			expect((result as StaffRoleEntityReference).isDefault).toBe(true);
		});
	});
});
