import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { expect, vi } from 'vitest';
import { list } from './list.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/list.feature'));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMockStaffRoleRef(id: string, roleName: string): Domain.Contexts.User.StaffRole.StaffRoleEntityReference {
	return {
		id,
		roleName,
		enterpriseAppRole: '',
		isDefault: false,
		roleType: null,
		permissions: {
			communityPermissions: {
				canManageCommunities: false,
				canManageStaffRolesAndPermissions: false,
				canManageAllCommunities: false,
				canDeleteCommunities: false,
				canChangeCommunityOwner: false,
				canReIndexSearchCollections: false,
			},
			userPermissions: {
				canManageUsers: false,
			},
		},
		createdAt: new Date(),
		updatedAt: new Date(),
		schemaVersion: '1.0',
	} as unknown as Domain.Contexts.User.StaffRole.StaffRoleEntityReference;
}

function makeDataSources(roles: Domain.Contexts.User.StaffRole.StaffRoleEntityReference[]): DataSources {
	return {
		readonlyDataSource: {
			User: {
				StaffRole: {
					StaffRoleReadRepo: {
						getAll: vi.fn().mockResolvedValue(roles),
					},
				},
			},
		},
	} as unknown as DataSources;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let dataSources: DataSources;
	let result: Domain.Contexts.User.StaffRole.StaffRoleEntityReference[] | undefined;
	let thrownError: unknown;

	BeforeEachScenario(() => {
		result = undefined;
		thrownError = undefined;
	});

	// ─── Roles exist ──────────────────────────────────────────────────────────

	Scenario('Returns all staff roles when roles exist', ({ Given, When, Then }) => {
		Given('the repository contains two staff roles', () => {
			const roles = [makeMockStaffRoleRef('role-001', 'Admin'), makeMockStaffRoleRef('role-002', 'Manager')];
			dataSources = makeDataSources(roles);
		});

		When('I call list', async () => {
			try {
				result = await list(dataSources)();
			} catch (e) {
				thrownError = e;
			}
		});

		Then('it should return all staff roles', () => {
			expect(thrownError).toBeUndefined();
			expect(result).toHaveLength(2);
			const roles = result as Domain.Contexts.User.StaffRole.StaffRoleEntityReference[];
			const [first, second] = roles;
			expect(first?.id).toBe('role-001');
			expect(second?.id).toBe('role-002');
		});
	});

	// ─── No roles ─────────────────────────────────────────────────────────────

	Scenario('Returns an empty list when no staff roles exist', ({ Given, When, Then }) => {
		Given('the repository contains no staff roles', () => {
			dataSources = makeDataSources([]);
		});

		When('I call list', async () => {
			try {
				result = await list(dataSources)();
			} catch (e) {
				thrownError = e;
			}
		});

		Then('it should return an empty list', () => {
			expect(thrownError).toBeUndefined();
			expect(result).toHaveLength(0);
		});
	});
});
