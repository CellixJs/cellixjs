import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { expect, vi } from 'vitest';
import { queryByExternalId } from './query-by-external-id.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/query-by-external-id.feature'));

function makeMockStaffUserRef(externalId: string): Domain.Contexts.User.StaffUser.StaffUserEntityReference {
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
	} as unknown as Domain.Contexts.User.StaffUser.StaffUserEntityReference;
}

function makeDataSources(existingUser: Domain.Contexts.User.StaffUser.StaffUserEntityReference | null): DataSources {
	return {
		readonlyDataSource: {
			User: {
				StaffUser: {
					StaffUserReadRepo: {
						getByExternalId: vi.fn().mockResolvedValue(existingUser),
					},
				},
			},
		},
	} as unknown as DataSources;
}

test.for(feature, ({ Scenario }) => {
	Scenario('Returns a staff user when the external ID exists', ({ Given, When, Then }) => {
		let dataSources: DataSources;
		let result: Domain.Contexts.User.StaffUser.StaffUserEntityReference | null;
		let expectedUser: Domain.Contexts.User.StaffUser.StaffUserEntityReference;

		Given('a staff user with externalId "ext-123" exists in the read repository', () => {
			expectedUser = makeMockStaffUserRef('ext-123');
			dataSources = makeDataSources(expectedUser);
		});

		When('I call queryByExternalId with externalId "ext-123"', async () => {
			result = await queryByExternalId(dataSources)({ externalId: 'ext-123' });
		});

		Then('it should return the matching staff user', () => {
			expect(result).toBe(expectedUser);
			expect(result?.externalId).toBe('ext-123');
		});
	});

	Scenario('Returns null when no staff user matches the external ID', ({ Given, When, Then }) => {
		let dataSources: DataSources;
		let result: Domain.Contexts.User.StaffUser.StaffUserEntityReference | null;

		Given('no staff user with externalId "ext-missing" exists in the read repository', () => {
			dataSources = makeDataSources(null);
		});

		When('I call queryByExternalId with externalId "ext-missing"', async () => {
			result = await queryByExternalId(dataSources)({ externalId: 'ext-missing' });
		});

		Then('it should return null', () => {
			expect(result).toBeNull();
		});
	});
});
