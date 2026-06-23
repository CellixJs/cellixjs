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

function makeMockStaffUserRef(id: string, firstName: string): Domain.Contexts.User.StaffUser.StaffUserEntityReference {
	return {
		id,
		externalId: `ext-${id}`,
		firstName,
		lastName: 'Doe',
		displayName: `${firstName} Doe`,
		email: `${firstName.toLowerCase()}@example.com`,
		accessBlocked: false,
		tags: [],
		userType: 'staff',
		role: undefined,
		createdAt: new Date(),
		updatedAt: new Date(),
		schemaVersion: '1.0',
	} as unknown as Domain.Contexts.User.StaffUser.StaffUserEntityReference;
}

function makeDataSources(users: Domain.Contexts.User.StaffUser.StaffUserEntityReference[]): DataSources {
	return {
		readonlyDataSource: {
			User: {
				StaffUser: {
					StaffUserReadRepo: {
						getAll: vi.fn().mockResolvedValue(users),
					},
				},
			},
		},
	} as unknown as DataSources;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let dataSources: DataSources;
	let result: Domain.Contexts.User.StaffUser.StaffUserEntityReference[] | undefined;
	let thrownError: unknown;

	BeforeEachScenario(() => {
		result = undefined;
		thrownError = undefined;
	});

	// ─── Users exist ──────────────────────────────────────────────────────────

	Scenario('Returns all staff users when users exist', ({ Given, When, Then }) => {
		Given('the repository contains two staff users', () => {
			const users = [makeMockStaffUserRef('user-001', 'Alice'), makeMockStaffUserRef('user-002', 'Bob')];
			dataSources = makeDataSources(users);
		});

		When('I call list', async () => {
			try {
				result = await list(dataSources)();
			} catch (e) {
				thrownError = e;
			}
		});

		Then('it should return all staff users', () => {
			expect(thrownError).toBeUndefined();
			expect(result).toHaveLength(2);
			const [first, second] = result as Domain.Contexts.User.StaffUser.StaffUserEntityReference[];
			expect(first?.id).toBe('user-001');
			expect(second?.id).toBe('user-002');
		});
	});

	// ─── No users ─────────────────────────────────────────────────────────────

	Scenario('Returns an empty list when no staff users exist', ({ Given, When, Then }) => {
		Given('the repository contains no staff users', () => {
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
