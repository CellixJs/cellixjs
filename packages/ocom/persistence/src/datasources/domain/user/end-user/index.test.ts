import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { EndUserModelType } from '@ocom/data-sources-mongoose-models/user';
import type { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { EndUserPersistence } from './index.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/index.feature'),
);

function makeMockModelsContext() {
	return {
		User: {
			EndUser: {
				findById: vi.fn(),
				find: vi.fn(),
				create: vi.fn(),
				updateOne: vi.fn(),
				deleteOne: vi.fn(),
			} as unknown as EndUserModelType,
		},
	} as unknown as Parameters<typeof EndUserPersistence>[0];
}

function makeMockPassport() {
	return {
		community: {
			forCommunity: vi.fn(() => ({
				determineIf: vi.fn(() => true),
			})),
		},
		user: {
			forEndUser: vi.fn(() => ({
				determineIf: vi.fn(() => true),
			})),
		},
	} as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let models: Parameters<typeof EndUserPersistence>[0];
	let passport: Domain.Passport;
	let result: ReturnType<typeof EndUserPersistence>;

	BeforeEachScenario(() => {
		models = makeMockModelsContext();
		passport = makeMockPassport();
		result = {} as ReturnType<typeof EndUserPersistence>;
	});

	Background(({ Given, And }) => {
		Given('a valid models context with EndUser model', () => {
			// Setup is done in BeforeEachScenario
		});

		And('a valid passport for domain operations', () => {
			// Setup is done in BeforeEachScenario
		});
	});

	Scenario('Creating EndUser Persistence', ({ When, Then, And }) => {
		When('I call EndUserPersistence with models and passport', () => {
			result = EndUserPersistence(models, passport);
		});

		Then('I should receive an object with EndUserUnitOfWork property', () => {
			expect(result).toBeDefined();
			expect(typeof result).toBe('object');
			expect(result).toHaveProperty('EndUserUnitOfWork');
		});

		And('the EndUserUnitOfWork should be properly initialized', () => {
			expect(result.EndUserUnitOfWork).toBeDefined();
			expect(typeof result.EndUserUnitOfWork).toBe('object');
			expect(result.EndUserUnitOfWork).toHaveProperty('withTransaction');
			expect(result.EndUserUnitOfWork).toHaveProperty('withScopedTransaction');
			expect(result.EndUserUnitOfWork).toHaveProperty(
				'withScopedTransactionById',
			);
		});
	});
});
