import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { StaffRole } from '@ocom/data-sources-mongoose-models/role/staff-role';
import { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import {
	StaffRoleCommunityPermissionsAdapter,
	StaffRoleConverter,
	StaffRoleDomainAdapter,
	StaffRoleFinancePermissionsAdapter,
	StaffRolePermissionsAdapter,
	StaffRolePropertyPermissionsAdapter,
	StaffRoleServicePermissionsAdapter,
	StaffRoleServiceTicketPermissionsAdapter,
	StaffRoleTechAdminPermissionsAdapter,
	StaffRoleUserPermissionsAdapter,
	StaffRoleViolationTicketPermissionsAdapter,
} from './staff-role.domain-adapter.ts';

const test = { for: describeFeature };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const domainAdapterFeature = await loadFeature(path.resolve(__dirname, 'features/staff-role.domain-adapter.feature'));
const typeConverterFeature = await loadFeature(path.resolve(__dirname, 'features/staff-role.type-converter.feature'));

function makeStaffRoleDoc(overrides: Partial<StaffRole> = {}) {
	const base = {
		roleName: 'Manager',
		isDefault: false,
		roleType: 'staff',
		permissions: {
			communityPermissions: {
				canManageStaffRolesAndPermissions: false,
				canManageAllCommunities: false,
				canDeleteCommunities: false,
				canChangeCommunityOwner: false,
				canReIndexSearchCollections: false,
			},
			propertyPermissions: {
				canManageProperties: false,
				canEditOwnProperty: false,
			},
			servicePermissions: {
				canManageServices: false,
			},
			userPermissions: {
				canManageUsers: false,
				canAssignStaffRoles: false,
				canViewStaffUsers: false,
			},
			serviceTicketPermissions: {
				canCreateTickets: false,
				canManageTickets: false,
				canAssignTickets: false,
				canWorkOnTickets: false,
			},
			violationTicketPermissions: {
				canCreateTickets: false,
				canManageTickets: false,
				canAssignTickets: false,
				canWorkOnTickets: false,
			},
		},
		...overrides,
	} as StaffRole;
	return vi.mocked(base);
}

function makeMockPassport() {
	return {
		user: {
			forStaffRole: vi.fn(() => ({
				determineIf: vi.fn(() => true),
			})),
		},
	} as unknown as Domain.Passport;
}

test.for(domainAdapterFeature, ({ Scenario, Background, BeforeEachScenario }) => {
	let doc: StaffRole;
	let adapter: StaffRoleDomainAdapter;
	let result: unknown;

	BeforeEachScenario(() => {
		doc = makeStaffRoleDoc();
		adapter = new StaffRoleDomainAdapter(doc);
		result = undefined;
	});

	Background(({ Given }) => {
		Given('a valid Mongoose StaffRole document with roleName "Manager", isDefault false, and roleType "staff"', () => {
			doc = makeStaffRoleDoc();
			adapter = new StaffRoleDomainAdapter(doc);
		});
	});

	Scenario('Getting the roleName property', ({ Given, When, Then }) => {
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the roleName property', () => {
			result = adapter.roleName;
		});
		Then('it should return "Manager"', () => {
			expect(result).toBe('Manager');
		});
	});

	Scenario('Getting and setting the roleName property', ({ Given, When, Then }) => {
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I set the roleName property to "Supervisor"', () => {
			adapter.roleName = 'Supervisor';
		});
		Then('the document\'s roleName should be "Supervisor"', () => {
			expect(doc.roleName).toBe('Supervisor');
		});
	});

	Scenario('Setting the roleName updates the enterpriseAppRole', ({ Given, When, Then }) => {
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I set the roleName property to "Supervisor"', () => {
			adapter.roleName = 'Supervisor';
		});
		Then('the document\'s enterpriseAppRole should be "Supervisor"', () => {
			expect(doc.enterpriseAppRole).toBe('Supervisor');
		});
	});

	Scenario('Getting the enterpriseAppRole property', ({ Given, When, Then }) => {
		Given('a StaffRoleDomainAdapter for the document with enterpriseAppRole "Staff.Manager"', () => {
			doc = makeStaffRoleDoc({ enterpriseAppRole: 'Staff.Manager' });
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the enterpriseAppRole property', () => {
			result = adapter.enterpriseAppRole;
		});
		Then('it should return "Staff.Manager"', () => {
			expect(result).toBe('Staff.Manager');
		});
	});

	Scenario('Getting the enterpriseAppRole property when missing', ({ Given, When, Then }) => {
		Given('a StaffRoleDomainAdapter for the document with no enterpriseAppRole', () => {
			doc = makeStaffRoleDoc();
			(doc as unknown as Record<string, unknown>)['enterpriseAppRole'] = undefined;
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the enterpriseAppRole property', () => {
			result = adapter.enterpriseAppRole;
		});
		Then('it should return ""', () => {
			expect(result).toBe('');
		});
	});

	Scenario('Setting the enterpriseAppRole property', ({ Given, When, Then }) => {
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I set the enterpriseAppRole property to "Staff.Supervisor"', () => {
			adapter.enterpriseAppRole = 'Staff.Supervisor';
		});
		Then('the document\'s enterpriseAppRole should be "Staff.Supervisor"', () => {
			expect(doc.enterpriseAppRole).toBe('Staff.Supervisor');
		});
	});

	Scenario('Getting the isDefault property', ({ Given, When, Then }) => {
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the isDefault property', () => {
			result = adapter.isDefault;
		});
		Then('it should return false', () => {
			expect(result).toBe(false);
		});
	});

	Scenario('Getting and setting the isDefault property', ({ Given, When, Then }) => {
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I set the isDefault property to true', () => {
			adapter.isDefault = true;
		});
		Then("the document's isDefault should be true", () => {
			expect(doc.isDefault).toBe(true);
		});
	});

	Scenario('Getting the roleType property', ({ Given, When, Then }) => {
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the roleType property', () => {
			result = adapter.roleType;
		});
		Then('it should return "staff"', () => {
			expect(result).toBe('staff');
		});
	});

	Scenario('Getting the permissions property', ({ Given, When, Then }) => {
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			result = adapter.permissions;
		});
		Then('it should return a StaffRolePermissionsAdapter instance', () => {
			expect(result).toBeInstanceOf(StaffRolePermissionsAdapter);
		});
	});

	Scenario('Getting communityPermissions from permissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the communityPermissions property', () => {
			result = permissions.communityPermissions;
		});
		Then('it should return a StaffRoleCommunityPermissionsAdapter instance', () => {
			expect(result).toBeInstanceOf(StaffRoleCommunityPermissionsAdapter);
		});
	});

	Scenario('Getting and setting canManageStaffRolesAndPermissions from communityPermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let communityPermissions: StaffRoleCommunityPermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the communityPermissions property', () => {
			communityPermissions = permissions.communityPermissions as StaffRoleCommunityPermissionsAdapter;
		});
		And('I get the canManageStaffRolesAndPermissions property', () => {
			result = communityPermissions.canManageStaffRolesAndPermissions;
		});
		Then('it should return false', () => {
			expect(result).toBe(false);
		});
		When('I set the canManageStaffRolesAndPermissions property to true', () => {
			communityPermissions.canManageStaffRolesAndPermissions = true;
		});
		Then("the communityPermissions' canManageStaffRolesAndPermissions should be true", () => {
			expect(doc.permissions?.communityPermissions?.canManageStaffRolesAndPermissions).toBe(true);
		});
	});

	Scenario('Getting and setting canManageAllCommunities from communityPermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let communityPermissions: StaffRoleCommunityPermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the communityPermissions property', () => {
			communityPermissions = permissions.communityPermissions as StaffRoleCommunityPermissionsAdapter;
		});
		And('I get the canManageAllCommunities property', () => {
			result = communityPermissions.canManageAllCommunities;
		});
		Then('it should return false', () => {
			expect(result).toBe(false);
		});
		When('I set the canManageAllCommunities property to true', () => {
			communityPermissions.canManageAllCommunities = true;
		});
		Then("the communityPermissions' canManageAllCommunities should be true", () => {
			expect(doc.permissions?.communityPermissions?.canManageAllCommunities).toBe(true);
		});
	});

	Scenario('Getting and setting canDeleteCommunities from communityPermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let communityPermissions: StaffRoleCommunityPermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the communityPermissions property', () => {
			communityPermissions = permissions.communityPermissions as StaffRoleCommunityPermissionsAdapter;
		});
		And('I get the canDeleteCommunities property', () => {
			result = communityPermissions.canDeleteCommunities;
		});
		Then('it should return false', () => {
			expect(result).toBe(false);
		});
		When('I set the canDeleteCommunities property to true', () => {
			communityPermissions.canDeleteCommunities = true;
		});
		Then("the communityPermissions' canDeleteCommunities should be true", () => {
			expect(doc.permissions?.communityPermissions?.canDeleteCommunities).toBe(true);
		});
	});

	Scenario('Getting and setting canChangeCommunityOwner from communityPermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let communityPermissions: StaffRoleCommunityPermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the communityPermissions property', () => {
			communityPermissions = permissions.communityPermissions as StaffRoleCommunityPermissionsAdapter;
		});
		And('I get the canChangeCommunityOwner property', () => {
			result = communityPermissions.canChangeCommunityOwner;
		});
		Then('it should return false', () => {
			expect(result).toBe(false);
		});
		When('I set the canChangeCommunityOwner property to true', () => {
			communityPermissions.canChangeCommunityOwner = true;
		});
		Then("the communityPermissions' canChangeCommunityOwner should be true", () => {
			expect(doc.permissions?.communityPermissions?.canChangeCommunityOwner).toBe(true);
		});
	});

	Scenario('Getting and setting canReIndexSearchCollections from communityPermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let communityPermissions: StaffRoleCommunityPermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the communityPermissions property', () => {
			communityPermissions = permissions.communityPermissions as StaffRoleCommunityPermissionsAdapter;
		});
		And('I get the canReIndexSearchCollections property', () => {
			result = communityPermissions.canReIndexSearchCollections;
		});
		Then('it should return false', () => {
			expect(result).toBe(false);
		});
		When('I set the canReIndexSearchCollections property to true', () => {
			communityPermissions.canReIndexSearchCollections = true;
		});
		Then("the communityPermissions' canReIndexSearchCollections should be true", () => {
			expect(doc.permissions?.communityPermissions?.canReIndexSearchCollections).toBe(true);
		});
	});

	Scenario('Getting propertyPermissions from permissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the propertyPermissions property', () => {
			result = permissions.propertyPermissions;
		});
		Then('it should return a StaffRolePropertyPermissionsAdapter instance', () => {
			expect(result).toBeInstanceOf(StaffRolePropertyPermissionsAdapter);
		});
	});

	Scenario('Getting and setting canManageProperties from propertyPermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let propertyPermissions: StaffRolePropertyPermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the propertyPermissions property', () => {
			propertyPermissions = permissions.propertyPermissions as StaffRolePropertyPermissionsAdapter;
		});
		And('I get the canManageProperties property', () => {
			result = propertyPermissions.canManageProperties;
		});
		Then('it should return false', () => {
			expect(result).toBe(false);
		});
		When('I set the canManageProperties property to true', () => {
			propertyPermissions.canManageProperties = true;
		});
		Then("the propertyPermissions' canManageProperties should be true", () => {
			expect(doc.permissions?.propertyPermissions?.canManageProperties).toBe(true);
		});
	});

	Scenario('Getting and setting canEditOwnProperty from propertyPermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let propertyPermissions: StaffRolePropertyPermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the propertyPermissions property', () => {
			propertyPermissions = permissions.propertyPermissions as StaffRolePropertyPermissionsAdapter;
		});
		And('I get the canEditOwnProperty property', () => {
			result = propertyPermissions.canEditOwnProperty;
		});
		Then('it should return false', () => {
			expect(result).toBe(false);
		});
		When('I set the canEditOwnProperty property to true', () => {
			propertyPermissions.canEditOwnProperty = true;
		});
		Then("the propertyPermissions' canEditOwnProperty should be true", () => {
			expect(doc.permissions?.propertyPermissions?.canEditOwnProperty).toBe(true);
		});
	});

	Scenario('Getting servicePermissions from permissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the servicePermissions property', () => {
			result = permissions.servicePermissions;
		});
		Then('it should return a StaffRoleServicePermissionsAdapter instance', () => {
			expect(result).toBeInstanceOf(StaffRoleServicePermissionsAdapter);
		});
	});

	Scenario('Getting canManageServices from servicePermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let servicePermissions: StaffRoleServicePermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the servicePermissions property', () => {
			servicePermissions = permissions.servicePermissions as StaffRoleServicePermissionsAdapter;
		});
		And('I get the canManageServices property', () => {
			result = servicePermissions.canManageServices;
		});
		Then('it should return false', () => {
			expect(result).toBe(false);
		});
	});

	Scenario('Getting serviceTicketPermissions from permissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the serviceTicketPermissions property', () => {
			result = permissions.serviceTicketPermissions;
		});
		Then('it should return a StaffRoleServiceTicketPermissionsAdapter instance', () => {
			expect(result).toBeInstanceOf(StaffRoleServiceTicketPermissionsAdapter);
		});
	});

	Scenario('Getting ticket permissions from serviceTicketPermissions', ({ Given, When, Then, And }) => {
		let permissions: StaffRolePermissionsAdapter;
		let serviceTicketPermissions: StaffRoleServiceTicketPermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the serviceTicketPermissions property', () => {
			serviceTicketPermissions = permissions.serviceTicketPermissions as StaffRoleServiceTicketPermissionsAdapter;
		});
		Then('the canCreateTickets property should return false', () => {
			expect(serviceTicketPermissions.canCreateTickets).toBe(false);
		});
		And('the canManageTickets property should return false', () => {
			expect(serviceTicketPermissions.canManageTickets).toBe(false);
		});
		And('the canAssignTickets property should return false', () => {
			expect(serviceTicketPermissions.canAssignTickets).toBe(false);
		});
		And('the canWorkOnTickets property should return false', () => {
			expect(serviceTicketPermissions.canWorkOnTickets).toBe(false);
		});
	});

	Scenario('Getting violationTicketPermissions from permissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the violationTicketPermissions property', () => {
			result = permissions.violationTicketPermissions;
		});
		Then('it should return a StaffRoleViolationTicketPermissionsAdapter instance', () => {
			expect(result).toBeInstanceOf(StaffRoleViolationTicketPermissionsAdapter);
		});
	});

	Scenario('Getting and setting violation ticket permissions', ({ Given, When, Then, And }) => {
		let permissions: StaffRolePermissionsAdapter;
		let violationTicketPermissions: StaffRoleViolationTicketPermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the violationTicketPermissions property', () => {
			violationTicketPermissions = permissions.violationTicketPermissions as StaffRoleViolationTicketPermissionsAdapter;
		});
		Then('the canCreateTickets property should return false', () => {
			expect(violationTicketPermissions.canCreateTickets).toBe(false);
		});
		And('the canManageTickets property should return false', () => {
			expect(violationTicketPermissions.canManageTickets).toBe(false);
		});
		And('the canAssignTickets property should return false', () => {
			expect(violationTicketPermissions.canAssignTickets).toBe(false);
		});
		And('the canWorkOnTickets property should return false', () => {
			expect(violationTicketPermissions.canWorkOnTickets).toBe(false);
		});
		When('I set the canCreateTickets property to true', () => {
			violationTicketPermissions.canCreateTickets = true;
		});
		Then("the violationTicketPermissions' canCreateTickets should be true", () => {
			expect(doc.permissions?.violationTicketPermissions?.canCreateTickets).toBe(true);
		});
	});

	// ─── canManageCommunities ─────────────────────────────────────────────────

	Scenario('Getting and setting canManageCommunities from communityPermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let communityPermissions: StaffRoleCommunityPermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the communityPermissions property', () => {
			communityPermissions = permissions.communityPermissions as StaffRoleCommunityPermissionsAdapter;
		});
		And('I get the canManageCommunities property', () => {
			result = communityPermissions.canManageCommunities;
		});
		Then('it should return false', () => {
			expect(result).toBe(false);
		});
		When('I set the canManageCommunities property to true', () => {
			communityPermissions.canManageCommunities = true;
		});
		Then("the communityPermissions' canManageCommunities should be true", () => {
			expect(doc.permissions?.communityPermissions?.canManageCommunities).toBe(true);
		});
	});

	// ─── financePermissions ───────────────────────────────────────────────────

	Scenario('Getting financePermissions from permissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the financePermissions property', () => {
			result = permissions.financePermissions;
		});
		Then('it should return a StaffRoleFinancePermissionsAdapter instance', () => {
			expect(result).toBeInstanceOf(StaffRoleFinancePermissionsAdapter);
		});
	});

	Scenario('Getting and setting canManageFinance from financePermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let financePermissions: StaffRoleFinancePermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the financePermissions property', () => {
			financePermissions = permissions.financePermissions as StaffRoleFinancePermissionsAdapter;
		});
		Then('the canManageFinance property should return false', () => {
			expect(financePermissions.canManageFinance).toBe(false);
		});
		When('I set the canManageFinance property to true', () => {
			financePermissions.canManageFinance = true;
		});
		Then("the financePermissions' canManageFinance should be true", () => {
			expect(doc.permissions?.financePermissions?.canManageFinance).toBe(true);
		});
	});

	Scenario('Getting and setting canViewGLBatchSummaries from financePermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let financePermissions: StaffRoleFinancePermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the financePermissions property', () => {
			financePermissions = permissions.financePermissions as StaffRoleFinancePermissionsAdapter;
		});
		Then('the canViewGLBatchSummaries property should return false', () => {
			expect(financePermissions.canViewGLBatchSummaries).toBe(false);
		});
		When('I set the canViewGLBatchSummaries property to true', () => {
			financePermissions.canViewGLBatchSummaries = true;
		});
		Then("the financePermissions' canViewGLBatchSummaries should be true", () => {
			expect(doc.permissions?.financePermissions?.canViewGLBatchSummaries).toBe(true);
		});
	});

	Scenario('Getting and setting canViewFinanceConfigs from financePermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let financePermissions: StaffRoleFinancePermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the financePermissions property', () => {
			financePermissions = permissions.financePermissions as StaffRoleFinancePermissionsAdapter;
		});
		Then('the canViewFinanceConfigs property should return false', () => {
			expect(financePermissions.canViewFinanceConfigs).toBe(false);
		});
		When('I set the canViewFinanceConfigs property to true', () => {
			financePermissions.canViewFinanceConfigs = true;
		});
		Then("the financePermissions' canViewFinanceConfigs should be true", () => {
			expect(doc.permissions?.financePermissions?.canViewFinanceConfigs).toBe(true);
		});
	});

	Scenario('Getting and setting canCreateFinanceConfigs from financePermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let financePermissions: StaffRoleFinancePermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the financePermissions property', () => {
			financePermissions = permissions.financePermissions as StaffRoleFinancePermissionsAdapter;
		});
		Then('the canCreateFinanceConfigs property should return false', () => {
			expect(financePermissions.canCreateFinanceConfigs).toBe(false);
		});
		When('I set the canCreateFinanceConfigs property to true', () => {
			financePermissions.canCreateFinanceConfigs = true;
		});
		Then("the financePermissions' canCreateFinanceConfigs should be true", () => {
			expect(doc.permissions?.financePermissions?.canCreateFinanceConfigs).toBe(true);
		});
	});

	// ─── techAdminPermissions ─────────────────────────────────────────────────

	Scenario('Getting techAdminPermissions from permissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the techAdminPermissions property', () => {
			result = permissions.techAdminPermissions;
		});
		Then('it should return a StaffRoleTechAdminPermissionsAdapter instance', () => {
			expect(result).toBeInstanceOf(StaffRoleTechAdminPermissionsAdapter);
		});
	});

	Scenario('Getting and setting canManageTechAdmin from techAdminPermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let techAdminPermissions: StaffRoleTechAdminPermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the techAdminPermissions property', () => {
			techAdminPermissions = permissions.techAdminPermissions as StaffRoleTechAdminPermissionsAdapter;
		});
		Then('the canManageTechAdmin property should return false', () => {
			expect(techAdminPermissions.canManageTechAdmin).toBe(false);
		});
		When('I set the canManageTechAdmin property to true', () => {
			techAdminPermissions.canManageTechAdmin = true;
		});
		Then("the techAdminPermissions' canManageTechAdmin should be true", () => {
			expect(doc.permissions?.techAdminPermissions?.canManageTechAdmin).toBe(true);
		});
	});

	Scenario('Getting and setting canViewDatabaseExplorer from techAdminPermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let techAdminPermissions: StaffRoleTechAdminPermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the techAdminPermissions property', () => {
			techAdminPermissions = permissions.techAdminPermissions as StaffRoleTechAdminPermissionsAdapter;
		});
		Then('the canViewDatabaseExplorer property should return false', () => {
			expect(techAdminPermissions.canViewDatabaseExplorer).toBe(false);
		});
		When('I set the canViewDatabaseExplorer property to true', () => {
			techAdminPermissions.canViewDatabaseExplorer = true;
		});
		Then("the techAdminPermissions' canViewDatabaseExplorer should be true", () => {
			expect(doc.permissions?.techAdminPermissions?.canViewDatabaseExplorer).toBe(true);
		});
	});

	Scenario('Getting and setting canViewBlobExplorer from techAdminPermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let techAdminPermissions: StaffRoleTechAdminPermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the techAdminPermissions property', () => {
			techAdminPermissions = permissions.techAdminPermissions as StaffRoleTechAdminPermissionsAdapter;
		});
		Then('the canViewBlobExplorer property should return false', () => {
			expect(techAdminPermissions.canViewBlobExplorer).toBe(false);
		});
		When('I set the canViewBlobExplorer property to true', () => {
			techAdminPermissions.canViewBlobExplorer = true;
		});
		Then("the techAdminPermissions' canViewBlobExplorer should be true", () => {
			expect(doc.permissions?.techAdminPermissions?.canViewBlobExplorer).toBe(true);
		});
	});

	Scenario('Getting and setting canViewQueueDashboard from techAdminPermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let techAdminPermissions: StaffRoleTechAdminPermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the techAdminPermissions property', () => {
			techAdminPermissions = permissions.techAdminPermissions as StaffRoleTechAdminPermissionsAdapter;
		});
		Then('the canViewQueueDashboard property should return false', () => {
			expect(techAdminPermissions.canViewQueueDashboard).toBe(false);
		});
		When('I set the canViewQueueDashboard property to true', () => {
			techAdminPermissions.canViewQueueDashboard = true;
		});
		Then("the techAdminPermissions' canViewQueueDashboard should be true", () => {
			expect(doc.permissions?.techAdminPermissions?.canViewQueueDashboard).toBe(true);
		});
	});

	Scenario('Getting and setting canSendQueueMessages from techAdminPermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let techAdminPermissions: StaffRoleTechAdminPermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the techAdminPermissions property', () => {
			techAdminPermissions = permissions.techAdminPermissions as StaffRoleTechAdminPermissionsAdapter;
		});
		Then('the canSendQueueMessages property should return false', () => {
			expect(techAdminPermissions.canSendQueueMessages).toBe(false);
		});
		When('I set the canSendQueueMessages property to true', () => {
			techAdminPermissions.canSendQueueMessages = true;
		});
		Then("the techAdminPermissions' canSendQueueMessages should be true", () => {
			expect(doc.permissions?.techAdminPermissions?.canSendQueueMessages).toBe(true);
		});
	});

	// ─── userPermissions ──────────────────────────────────────────────────────

	Scenario('Getting userPermissions from permissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the userPermissions property', () => {
			result = permissions.userPermissions;
		});
		Then('it should return a StaffRoleUserPermissionsAdapter instance', () => {
			expect(result).toBeInstanceOf(StaffRoleUserPermissionsAdapter);
		});
	});

	Scenario('Getting and setting canManageUsers from userPermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let userPermissions: StaffRoleUserPermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the userPermissions property', () => {
			userPermissions = permissions.userPermissions as StaffRoleUserPermissionsAdapter;
		});
		Then('the canManageUsers property should return false', () => {
			expect(userPermissions.canManageUsers).toBe(false);
		});
		When('I set the canManageUsers property to true', () => {
			userPermissions.canManageUsers = true;
		});
		Then("the userPermissions' canManageUsers should be true", () => {
			expect(doc.permissions?.userPermissions?.canManageUsers).toBe(true);
		});
	});

	// ─── Lazy-init paths ──────────────────────────────────────────────────────

	Scenario('Lazy-initialising permissions when document has no permissions object', ({ Given, When, Then }) => {
		Given('a StaffRoleDomainAdapter wrapping a document with no permissions object', () => {
			const docWithoutPermissions = makeStaffRoleDoc();
			docWithoutPermissions.set = vi.fn().mockImplementation((key: string, value: unknown) => {
				(docWithoutPermissions as unknown as Record<string, unknown>)[key] = value;
			});
			(docWithoutPermissions as unknown as Record<string, unknown>).permissions = undefined;
			adapter = new StaffRoleDomainAdapter(docWithoutPermissions);
		});
		When('I get the permissions property', () => {
			result = adapter.permissions;
		});
		Then('it should return a StaffRolePermissionsAdapter instance', () => {
			expect(result).toBeInstanceOf(StaffRolePermissionsAdapter);
		});
	});

	Scenario('Lazy-initialising communityPermissions when sub-document is absent', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		Given('a StaffRoleDomainAdapter wrapping a document with no communityPermissions sub-document', () => {
			const docWithout = makeStaffRoleDoc();
			if (docWithout.permissions) {
				(docWithout.permissions as unknown as Record<string, unknown>).communityPermissions = undefined;
			}
			adapter = new StaffRoleDomainAdapter(docWithout);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the communityPermissions property', () => {
			result = permissions.communityPermissions;
		});
		Then('it should return a StaffRoleCommunityPermissionsAdapter instance', () => {
			expect(result).toBeInstanceOf(StaffRoleCommunityPermissionsAdapter);
		});
		And('canManageCommunities should default to false', () => {
			expect((result as StaffRoleCommunityPermissionsAdapter).canManageCommunities).toBe(false);
		});
	});

	Scenario('Lazy-initialising financePermissions when sub-document is absent', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		Given('a StaffRoleDomainAdapter wrapping a document with no financePermissions sub-document', () => {
			const docWithout = makeStaffRoleDoc();
			if (docWithout.permissions) {
				(docWithout.permissions as unknown as Record<string, unknown>).financePermissions = undefined;
			}
			adapter = new StaffRoleDomainAdapter(docWithout);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the financePermissions property', () => {
			result = permissions.financePermissions;
		});
		Then('it should return a StaffRoleFinancePermissionsAdapter instance', () => {
			expect(result).toBeInstanceOf(StaffRoleFinancePermissionsAdapter);
		});
		And('canManageFinance should default to false', () => {
			expect((result as StaffRoleFinancePermissionsAdapter).canManageFinance).toBe(false);
		});
	});

	Scenario('Lazy-initialising techAdminPermissions when sub-document is absent', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		Given('a StaffRoleDomainAdapter wrapping a document with no techAdminPermissions sub-document', () => {
			const docWithout = makeStaffRoleDoc();
			if (docWithout.permissions) {
				(docWithout.permissions as unknown as Record<string, unknown>).techAdminPermissions = undefined;
			}
			adapter = new StaffRoleDomainAdapter(docWithout);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the techAdminPermissions property', () => {
			result = permissions.techAdminPermissions;
		});
		Then('it should return a StaffRoleTechAdminPermissionsAdapter instance', () => {
			expect(result).toBeInstanceOf(StaffRoleTechAdminPermissionsAdapter);
		});
		And('canManageTechAdmin should default to false', () => {
			expect((result as StaffRoleTechAdminPermissionsAdapter).canManageTechAdmin).toBe(false);
		});
	});

	Scenario('Lazy-initialising userPermissions when sub-document is absent', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		Given('a StaffRoleDomainAdapter wrapping a document with no userPermissions sub-document', () => {
			const docWithout = makeStaffRoleDoc();
			if (docWithout.permissions) {
				(docWithout.permissions as unknown as Record<string, unknown>).userPermissions = undefined;
			}
			adapter = new StaffRoleDomainAdapter(docWithout);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the userPermissions property', () => {
			result = permissions.userPermissions;
		});
		Then('it should return a StaffRoleUserPermissionsAdapter instance', () => {
			expect(result).toBeInstanceOf(StaffRoleUserPermissionsAdapter);
		});
		And('canManageUsers should default to false', () => {
			expect((result as StaffRoleUserPermissionsAdapter).canManageUsers).toBe(false);
		});
	});

	Scenario('Getting roleType returns null when document roleType is undefined', ({ Given, When, Then }) => {
		Given('a StaffRoleDomainAdapter wrapping a document with no roleType', () => {
			const docWithout = makeStaffRoleDoc();
			(docWithout as unknown as Record<string, unknown>).roleType = undefined;
			adapter = new StaffRoleDomainAdapter(docWithout);
		});
		When('I get the roleType property', () => {
			result = adapter.roleType;
		});
		Then('it should return null', () => {
			expect(result).toBeNull();
		});
	});

	// ─── enterpriseAppRole ────────────────────────────────────────────────────

	Scenario('Getting enterpriseAppRole returns empty string when not set on the document', ({ Given, When, Then }) => {
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the enterpriseAppRole property', () => {
			result = adapter.enterpriseAppRole;
		});
		Then('it should return an empty string', () => {
			expect(result).toBe('');
		});
	});

	Scenario('Getting and setting the enterpriseAppRole property', ({ Given, When, Then }) => {
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I set the enterpriseAppRole property to "LeadManager"', () => {
			adapter.enterpriseAppRole = 'LeadManager';
		});
		Then('the document\'s enterpriseAppRole should be "LeadManager"', () => {
			expect(doc.enterpriseAppRole).toBe('LeadManager');
		});
	});

	Scenario('Setting roleName also updates enterpriseAppRole on the document', ({ Given, When, Then }) => {
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I set the roleName property to "Director"', () => {
			adapter.roleName = 'Director';
		});
		Then('the document\'s enterpriseAppRole should also be "Director"', () => {
			expect(doc.enterpriseAppRole).toBe('Director');
		});
	});

	Scenario('canAssignStaffRoles getter falls back to canAssignStaffRoles when unset', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let userPermissions: StaffRoleUserPermissionsAdapter;
		Given('a StaffRoleDomainAdapter wrapping a document with userPermissions having only canAssignStaffRoles true', () => {
			const docWith = makeStaffRoleDoc({
				permissions: {
					...(makeStaffRoleDoc().permissions ?? {}),
					userPermissions: {
						canManageUsers: false,
						canAssignStaffRoles: true,
						canViewStaffUsers: false,
					},
				},
			});
			adapter = new StaffRoleDomainAdapter(docWith);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the userPermissions property', () => {
			userPermissions = permissions.userPermissions as StaffRoleUserPermissionsAdapter;
		});
		Then('the canAssignStaffRoles property should return true', () => {
			expect(userPermissions.canAssignStaffRoles).toBe(true);
		});
	});

	Scenario('Setting canAssignStaffRoles updates the canAssignStaffRoles property', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let userPermissions: StaffRoleUserPermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the userPermissions property', () => {
			userPermissions = permissions.userPermissions as StaffRoleUserPermissionsAdapter;
		});
		When('I set the canAssignStaffRoles property to true', () => {
			userPermissions.canAssignStaffRoles = true;
		});
		Then("the userPermissions' canAssignStaffRoles should be true", () => {
			expect(doc.permissions?.userPermissions?.canAssignStaffRoles).toBe(true);
		});
	});

	// ─── violationTicketPermissions setters ───────────────────────────────────

	Scenario('Setting canManageTickets on violationTicketPermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let violationTicketPermissions: StaffRoleViolationTicketPermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the violationTicketPermissions property', () => {
			violationTicketPermissions = permissions.violationTicketPermissions as StaffRoleViolationTicketPermissionsAdapter;
		});
		When('I set the canManageTickets property to true', () => {
			violationTicketPermissions.canManageTickets = true;
		});
		Then("the violationTicketPermissions' canManageTickets should be true", () => {
			expect(doc.permissions?.violationTicketPermissions?.canManageTickets).toBe(true);
		});
	});

	Scenario('Setting canAssignTickets on violationTicketPermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let violationTicketPermissions: StaffRoleViolationTicketPermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the violationTicketPermissions property', () => {
			violationTicketPermissions = permissions.violationTicketPermissions as StaffRoleViolationTicketPermissionsAdapter;
		});
		When('I set the canAssignTickets property to true', () => {
			violationTicketPermissions.canAssignTickets = true;
		});
		Then("the violationTicketPermissions' canAssignTickets should be true", () => {
			expect(doc.permissions?.violationTicketPermissions?.canAssignTickets).toBe(true);
		});
	});

	Scenario('Setting canWorkOnTickets on violationTicketPermissions', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		let violationTicketPermissions: StaffRoleViolationTicketPermissionsAdapter;
		Given('a StaffRoleDomainAdapter for the document', () => {
			adapter = new StaffRoleDomainAdapter(doc);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the violationTicketPermissions property', () => {
			violationTicketPermissions = permissions.violationTicketPermissions as StaffRoleViolationTicketPermissionsAdapter;
		});
		When('I set the canWorkOnTickets property to true', () => {
			violationTicketPermissions.canWorkOnTickets = true;
		});
		Then("the violationTicketPermissions' canWorkOnTickets should be true", () => {
			expect(doc.permissions?.violationTicketPermissions?.canWorkOnTickets).toBe(true);
		});
	});

	// ─── Lazy-init remaining sub-documents ────────────────────────────────────

	Scenario('Lazy-initialising propertyPermissions when sub-document is absent', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		Given('a StaffRoleDomainAdapter wrapping a document with no propertyPermissions sub-document', () => {
			const docWithout = makeStaffRoleDoc();
			if (docWithout.permissions) {
				(docWithout.permissions as unknown as Record<string, unknown>).propertyPermissions = undefined;
			}
			adapter = new StaffRoleDomainAdapter(docWithout);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the propertyPermissions property', () => {
			result = permissions.propertyPermissions;
		});
		Then('it should return a StaffRolePropertyPermissionsAdapter instance', () => {
			expect(result).toBeInstanceOf(StaffRolePropertyPermissionsAdapter);
		});
		And('canManageProperties should default to false', () => {
			expect((result as StaffRolePropertyPermissionsAdapter).canManageProperties).toBe(false);
		});
	});

	Scenario('Lazy-initialising servicePermissions when sub-document is absent', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		Given('a StaffRoleDomainAdapter wrapping a document with no servicePermissions sub-document', () => {
			const docWithout = makeStaffRoleDoc();
			if (docWithout.permissions) {
				(docWithout.permissions as unknown as Record<string, unknown>).servicePermissions = undefined;
			}
			adapter = new StaffRoleDomainAdapter(docWithout);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the servicePermissions property', () => {
			result = permissions.servicePermissions;
		});
		Then('it should return a StaffRoleServicePermissionsAdapter instance', () => {
			expect(result).toBeInstanceOf(StaffRoleServicePermissionsAdapter);
		});
		And('canManageServices should default to false', () => {
			expect((result as StaffRoleServicePermissionsAdapter).canManageServices).toBe(false);
		});
	});

	Scenario('Lazy-initialising serviceTicketPermissions when sub-document is absent', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		Given('a StaffRoleDomainAdapter wrapping a document with no serviceTicketPermissions sub-document', () => {
			const docWithout = makeStaffRoleDoc();
			if (docWithout.permissions) {
				(docWithout.permissions as unknown as Record<string, unknown>).serviceTicketPermissions = undefined;
			}
			adapter = new StaffRoleDomainAdapter(docWithout);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the serviceTicketPermissions property', () => {
			result = permissions.serviceTicketPermissions;
		});
		Then('it should return a StaffRoleServiceTicketPermissionsAdapter instance', () => {
			expect(result).toBeInstanceOf(StaffRoleServiceTicketPermissionsAdapter);
		});
		And('canCreateTickets should default to false', () => {
			expect((result as StaffRoleServiceTicketPermissionsAdapter).canCreateTickets).toBe(false);
		});
	});

	Scenario('Lazy-initialising violationTicketPermissions when sub-document is absent', ({ Given, When, And, Then }) => {
		let permissions: StaffRolePermissionsAdapter;
		Given('a StaffRoleDomainAdapter wrapping a document with no violationTicketPermissions sub-document', () => {
			const docWithout = makeStaffRoleDoc();
			if (docWithout.permissions) {
				(docWithout.permissions as unknown as Record<string, unknown>).violationTicketPermissions = undefined;
			}
			adapter = new StaffRoleDomainAdapter(docWithout);
		});
		When('I get the permissions property', () => {
			permissions = adapter.permissions as StaffRolePermissionsAdapter;
		});
		And('I get the violationTicketPermissions property', () => {
			result = permissions.violationTicketPermissions;
		});
		Then('it should return a StaffRoleViolationTicketPermissionsAdapter instance', () => {
			expect(result).toBeInstanceOf(StaffRoleViolationTicketPermissionsAdapter);
		});
		And('canCreateTickets should default to false', () => {
			expect((result as StaffRoleViolationTicketPermissionsAdapter).canCreateTickets).toBe(false);
		});
	});
});

test.for(typeConverterFeature, ({ Scenario, Background, BeforeEachScenario }) => {
	let converter: StaffRoleConverter;
	let doc: StaffRole;
	let domainObject: Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter>;
	let result: Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter> | StaffRole | undefined;

	BeforeEachScenario(() => {
		converter = new StaffRoleConverter();
		doc = makeStaffRoleDoc();
		domainObject = {} as Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter>;
		result = undefined;
	});

	Background(({ Given }) => {
		Given('a valid Mongoose StaffRole document with roleName "Manager", isDefault false, and roleType "staff"', () => {
			doc = makeStaffRoleDoc();
		});
	});

	Scenario('Converting a Mongoose StaffRole document to a domain object', ({ Given, When, Then, And }) => {
		Given('a StaffRoleConverter instance', () => {
			converter = new StaffRoleConverter();
		});
		When('I call toDomain with the Mongoose StaffRole document', () => {
			result = converter.toDomain(doc, makeMockPassport()) as Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter>;
		});
		Then('I should receive a StaffRole domain object', () => {
			expect(result).toBeDefined();
			expect(result).toBeInstanceOf(Domain.Contexts.User.StaffRole.StaffRole);
		});
		And('the domain object\'s roleName should be "Manager"', () => {
			expect(result?.roleName).toBe('Manager');
		});
		And("the domain object's isDefault should be false", () => {
			expect(result?.isDefault).toBe(false);
		});
		And('the domain object\'s roleType should be "staff"', () => {
			expect(result?.roleType).toBe('staff');
		});
	});

	Scenario('Converting a domain object to a Mongoose StaffRole document', ({ Given, When, Then, And }) => {
		Given('a StaffRoleConverter instance', () => {
			converter = new StaffRoleConverter();
		});
		And('a StaffRole domain object with roleName "Supervisor", isDefault true, and roleType "admin"', () => {
			// Create a mock domain object
			const mockAdapter = new StaffRoleDomainAdapter(
				makeStaffRoleDoc({
					roleName: 'Supervisor',
					isDefault: true,
					roleType: 'admin',
				}),
			);
			domainObject = new Domain.Contexts.User.StaffRole.StaffRole(mockAdapter, makeMockPassport());
		});
		When('I call toPersistence with the StaffRole domain object', () => {
			result = converter.toPersistence(domainObject) as StaffRole;
		});
		Then('I should receive a Mongoose StaffRole document', () => {
			expect(result).toBeDefined();
			expect(result).toHaveProperty('roleName');
			expect(result).toHaveProperty('isDefault');
			expect(result).toHaveProperty('roleType');
		});
		And('the document\'s roleName should be "Supervisor"', () => {
			expect(result?.roleName).toBe('Supervisor');
		});
		And("the document's isDefault should be true", () => {
			expect(result?.isDefault).toBe(true);
		});
		And('the document\'s roleType should be "admin"', () => {
			expect(result?.roleType).toBe('admin');
		});
	});
});
