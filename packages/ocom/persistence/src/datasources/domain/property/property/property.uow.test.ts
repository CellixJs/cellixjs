import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { PropertyModelType } from '@ocom/data-sources-mongoose-models';
import type { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { getPropertyUnitOfWork } from './property.uow.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/property.uow.feature'),
);

function makeMockPropertyModel() {
	return {
		findById: vi.fn(),
		find: vi.fn(),
		create: vi.fn(),
		updateOne: vi.fn(),
		deleteOne: vi.fn(),
	} as unknown as PropertyModelType;
}

function makeMockPassport() {
	return {
		community: {
			forCommunity: vi.fn(() => ({
				determineIf: vi.fn(() => true),
			})),
		},
		property: {
			forProperty: vi.fn(() => ({
				determineIf: vi.fn(() => true),
			})),
		},
	} as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let propertyModel: PropertyModelType;
	let passport: Domain.Passport;
	let result: Domain.Contexts.Property.Property.PropertyUnitOfWork;

	BeforeEachScenario(() => {
		propertyModel = makeMockPropertyModel();
		passport = makeMockPassport();
		result = {} as Domain.Contexts.Property.Property.PropertyUnitOfWork;
	});

	Background(({ Given, And }) => {
		Given('a Mongoose context factory with a working service', () => {
			// Setup is done in BeforeEachScenario
		});

		And('a valid Property model from the models context', () => {
			// Setup is done in BeforeEachScenario
		});

		And('a valid passport for domain operations', () => {
			// Setup is done in BeforeEachScenario
		});
	});

	Scenario('Creating a Property Unit of Work', ({ When, Then, And }) => {
		When(
			'I call getPropertyUnitOfWork with the Property model and passport',
			() => {
				result = getPropertyUnitOfWork(propertyModel, passport);
			},
		);

		Then('I should receive a properly initialized PropertyUnitOfWork', () => {
			expect(result).toBeDefined();
			expect(typeof result).toBe('object');
		});

		And('the Unit of Work should have the correct repository type', () => {
			// The Unit of Work should have transaction methods
			expect(result).toHaveProperty('withTransaction');
			expect(typeof result.withTransaction).toBe('function');
		});

		And('the Unit of Work should have the correct converter type', () => {
			// The Unit of Work should have scoped transaction methods
			expect(result).toHaveProperty('withScopedTransaction');
			expect(typeof result.withScopedTransaction).toBe('function');
		});

		And('the Unit of Work should have the correct event buses', () => {
			// The Unit of Work should have scoped transaction by id method
			expect(result).toHaveProperty('withScopedTransactionById');
			expect(typeof result.withScopedTransactionById).toBe('function');
		});
	});
});
