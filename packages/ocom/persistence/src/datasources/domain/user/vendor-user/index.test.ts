import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { VendorUserModelType } from '@ocom/data-sources-mongoose-models/user';
import type { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { VendorUserPersistence } from './index.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/index.feature'),
);

function makeMockModelsContext() {
	return {
		User: {
			VendorUser: {
				findById: vi.fn(),
				findOne: vi.fn(),
				create: vi.fn(),
				updateOne: vi.fn(),
				deleteOne: vi.fn(),
			} as unknown as VendorUserModelType,
		},
	} as unknown as Parameters<typeof VendorUserPersistence>[0];
}

function makeMockPassport() {
	return {
		user: {
			forVendorUser: vi.fn(() => ({
				determineIf: vi.fn(() => true),
			})),
		},
	} as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let models: Parameters<typeof VendorUserPersistence>[0];
	let passport: Domain.Passport;
	let result: ReturnType<typeof VendorUserPersistence>;

	BeforeEachScenario(() => {
		models = makeMockModelsContext();
		passport = makeMockPassport();
		result = {} as ReturnType<typeof VendorUserPersistence>;
	});

	Background(({ Given, And }) => {
		Given('a valid models context with VendorUser model', () => {
			// Setup is done in BeforeEachScenario
		});

		And('a valid passport for domain operations', () => {
			// Setup is done in BeforeEachScenario
		});
	});

	Scenario('Creating VendorUser Persistence', ({ When, Then, And }) => {
		When('I call VendorUserPersistence with models and passport', () => {
			result = VendorUserPersistence(models, passport);
		});

		Then(
			'I should receive an object with VendorUserUnitOfWork property',
			() => {
				expect(result).toBeDefined();
				expect(typeof result).toBe('object');
				expect(result).toHaveProperty('VendorUserUnitOfWork');
			},
		);

		And('the VendorUserUnitOfWork should be properly initialized', () => {
			expect(result.VendorUserUnitOfWork).toBeDefined();
			expect(typeof result.VendorUserUnitOfWork).toBe('object');
			expect(result.VendorUserUnitOfWork).toHaveProperty('withTransaction');
			expect(result.VendorUserUnitOfWork).toHaveProperty(
				'withScopedTransaction',
			);
			expect(result.VendorUserUnitOfWork).toHaveProperty(
				'withScopedTransactionById',
			);
		});
	});
});
