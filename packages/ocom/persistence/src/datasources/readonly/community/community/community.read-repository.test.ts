import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type {
	Community,
	CommunityModelType,
} from '@ocom/data-sources-mongoose-models/community';
import type { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import type { ModelsContext } from '../../../../index.ts';
import { CommunityDataSourceImpl } from './community.data.ts';
import { CommunityReadRepositoryImpl } from './community.read-repository.ts';

// Mock the data source module

const test = { for: describeFeature };
vi.mock('./community.data.ts', () => ({
	CommunityDataSourceImpl: vi.fn(),
}));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/community.read-repository.feature'),
);

function makeMockModelsContext() {
	return {
		Community: {
			Community: {} as unknown as CommunityModelType,
		},
	} as ModelsContext;
}

function makeMockPassport() {
	return {
		community: {
			forCommunity: vi.fn(() => ({
				determineIf: vi.fn(() => true),
			})),
		},
	} as unknown as Domain.Passport;
}

function makeMockCommunityDocument() {
	return {
		_id: 'test-id',
		name: 'Test Community',
		description: 'A test community',
		createdBy: 'user-id',
		createdAt: new Date(),
		updatedAt: new Date(),
		id: 'test-id',
	} as unknown as Community;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let models: ModelsContext;
	let passport: Domain.Passport;
	let repository: CommunityReadRepositoryImpl;
	let mockCommunityDoc: Community;
	let mockDataSource: {
		find: ReturnType<typeof vi.fn>;
		findById: ReturnType<typeof vi.fn>;
		aggregate: ReturnType<typeof vi.fn>;
	};

	BeforeEachScenario(() => {
		models = makeMockModelsContext();
		passport = makeMockPassport();
		mockCommunityDoc = makeMockCommunityDocument();

		// Mock the data source
		mockDataSource = {
			find: vi.fn(async () => [mockCommunityDoc]),
			findById: vi.fn(async (id: string) =>
				id === 'test-id' ? mockCommunityDoc : null,
			),
			aggregate: vi.fn(async () => [mockCommunityDoc]),
		};

		// Mock the CommunityDataSourceImpl constructor
		vi.mocked(CommunityDataSourceImpl).mockImplementation(
			() =>
				mockDataSource as unknown as InstanceType<
					typeof CommunityDataSourceImpl
				>,
		);

		repository = new CommunityReadRepositoryImpl(models, passport);
	});

	Scenario('Creating Community Read Repository', ({ When, Then, And }) => {
		When(
			'I create a CommunityReadRepositoryImpl with models and passport',
			() => {
				// Repository is already created in BeforeEachScenario
			},
		);

		Then('I should receive a CommunityReadRepository instance', () => {
			expect(repository).toBeDefined();
			expect(repository).toBeInstanceOf(CommunityReadRepositoryImpl);
		});

		And('the repository should have all required methods', () => {
			expect(typeof repository.getAll).toBe('function');
			expect(typeof repository.getById).toBe('function');
			expect(typeof repository.getByIdWithCreatedBy).toBe('function');
			expect(typeof repository.getByEndUserExternalId).toBe('function');
		});
	});

	Scenario('Getting all communities', ({ When, Then }) => {
		When('I call getAll method', async () => {
			await repository.getAll();
		});

		Then(
			'I should receive an array of CommunityEntityReference objects',
			() => {
				expect(mockDataSource.find).toHaveBeenCalledWith({}, undefined);
			},
		);
	});

	Scenario('Getting community by ID when exists', ({ Given, When, Then }) => {
		Given('a community exists with ID "test-id"', () => {
			// Mock is already set up in BeforeEachScenario
		});

		When('I call getById with "test-id"', async () => {
			await repository.getById('test-id');
		});

		Then('I should receive the CommunityEntityReference object', () => {
			expect(mockDataSource.findById).toHaveBeenCalledWith(
				'test-id',
				undefined,
			);
		});
	});

	Scenario(
		'Getting community by ID when not exists',
		({ Given, When, Then }) => {
			Given('no community exists with ID "non-existent-id"', () => {
				mockDataSource.findById.mockResolvedValueOnce(null);
			});

			When('I call getById with "non-existent-id"', async () => {
				const result = await repository.getById('non-existent-id');
				expect(result).toBeNull();
			});

			Then('I should receive null', () => {
				expect(mockDataSource.findById).toHaveBeenCalledWith(
					'non-existent-id',
					undefined,
				);
			});
		},
	);

	Scenario(
		'Getting community by ID with createdBy',
		({ Given, When, Then }) => {
			Given('a community exists with ID "test-id"', () => {
				// Mock is already set up in BeforeEachScenario
			});

			When('I call getByIdWithCreatedBy with "test-id"', async () => {
				await repository.getByIdWithCreatedBy('test-id');
			});

			Then(
				'I should receive the CommunityEntityReference object with createdBy populated',
				() => {
					expect(mockDataSource.findById).toHaveBeenCalledWith('test-id', {
						populateFields: ['createdBy'],
					});
				},
			);
		},
	);

	Scenario(
		'Getting communities by end user external ID',
		({ Given, When, Then }) => {
			Given('an end user exists with external ID "user-123"', () => {
				// Mock is already set up in BeforeEachScenario
			});

			When('I call getByEndUserExternalId with "user-123"', async () => {
				await repository.getByEndUserExternalId('user-123');
			});

			Then(
				'I should receive an array of CommunityEntityReference objects for that user',
				() => {
					expect(mockDataSource.aggregate).toHaveBeenCalledWith(
						expect.arrayContaining([
							expect.objectContaining({
								$lookup: expect.objectContaining({ from: 'members' }),
							}),
							expect.objectContaining({ $unwind: '$m' }),
							expect.objectContaining({
								$lookup: expect.objectContaining({ from: 'users' }),
							}),
							expect.objectContaining({ $addFields: expect.any(Object) }),
							expect.objectContaining({ $match: expect.any(Object) }),
							expect.objectContaining({ $group: expect.any(Object) }),
							expect.objectContaining({ $replaceRoot: expect.any(Object) }),
							expect.objectContaining({ $project: expect.any(Object) }),
						]),
					);
				},
			);
		},
	);
});
