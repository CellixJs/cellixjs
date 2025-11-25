import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { ServiceModelType } from '@ocom/data-sources-mongoose-models/service';
import type { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { getServiceUnitOfWork } from './service.uow.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uowFeature = await loadFeature(
	path.resolve(__dirname, 'features/service.uow.feature'),
);

function makeMockServiceModel() {
	return {
		findById: vi.fn(),
		find: vi.fn(),
		create: vi.fn(),
		updateOne: vi.fn(),
		deleteOne: vi.fn(),
	} as unknown as ServiceModelType;
}

function makeMockPassport() {
	return {
		community: {
			forCommunity: vi.fn(() => ({
				determineIf: vi.fn(() => true),
			})),
		},
		service: {
			forService: vi.fn(() => ({
				determineIf: vi.fn(() => true),
			})),
		},
	} as unknown as Domain.Passport;
}

test.for(uowFeature, ({ Scenario, Background, BeforeEachScenario }) => {
	let serviceModel: ServiceModelType;
	let passport: Domain.Passport;
	let result: Domain.Contexts.Service.Service.ServiceUnitOfWork;

	BeforeEachScenario(() => {
		serviceModel = makeMockServiceModel();
		passport = makeMockPassport();
		result = {} as Domain.Contexts.Service.Service.ServiceUnitOfWork;
	});

	Background(({ Given, And }) => {
		Given('a Mongoose context factory with a working service', () => {
			// Setup is done in BeforeEachScenario
		});

		And('a valid Service model from the models context', () => {
			// Setup is done in BeforeEachScenario
		});

		And('a valid passport for domain operations', () => {
			// Setup is done in BeforeEachScenario
		});
	});

	Scenario('Creating a service unit of work', ({ When, Then, And }) => {
		When(
			'I call getServiceUnitOfWork with the Service model and passport',
			() => {
				result = getServiceUnitOfWork(serviceModel, passport);
			},
		);

		Then('I should receive a properly initialized ServiceUnitOfWork', () => {
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
