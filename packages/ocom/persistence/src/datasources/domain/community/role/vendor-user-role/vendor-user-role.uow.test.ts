import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { VendorUserRoleModelType } from '@ocom/data-sources-mongoose-models/role';
import type { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { getVendorUserRoleUnitOfWork } from './vendor-user-role.uow.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/vendor-user-role.uow.feature'),
);

function makeMockVendorUserRoleModel() {
	return {
		findById: vi.fn(),
		find: vi.fn(),
		create: vi.fn(),
		updateOne: vi.fn(),
		deleteOne: vi.fn(),
	} as unknown as VendorUserRoleModelType;
}

function makeMockPassport() {
	return {
		community: {
			forCommunity: vi.fn(() => ({
				determineIf: vi.fn(() => true),
			})),
		},
		user: {
			forVendorUser: vi.fn(() => ({
				determineIf: vi.fn(() => true),
			})),
		},
	} as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let vendorUserRoleModel: VendorUserRoleModelType;
	let passport: Domain.Passport;
	let result: Domain.Contexts.Community.Role.VendorUserRole.VendorUserRoleUnitOfWork;

	BeforeEachScenario(() => {
		vendorUserRoleModel = makeMockVendorUserRoleModel();
		passport = makeMockPassport();
		result = getVendorUserRoleUnitOfWork(vendorUserRoleModel, passport);
	});

	Background(({ Given, And }) => {
		Given('a valid VendorUserRole model', () => {
			// Setup is done in BeforeEachScenario
		});

		And('a valid passport for domain operations', () => {
			// Setup is done in BeforeEachScenario
		});
	});

	Scenario('Creating VendorUserRole Unit of Work', ({ When, Then, And }) => {
		When('I call getVendorUserRoleUnitOfWork with model and passport', () => {
			// Already called in BeforeEachScenario
		});

		Then('I should receive a VendorUserRoleUnitOfWork instance', () => {
			expect(result).toBeDefined();
			expect(typeof result).toBe('object');
		});

		And('the UnitOfWork should have transaction methods', () => {
			expect(result).toHaveProperty('withTransaction');
			expect(result).toHaveProperty('withScopedTransaction');
			expect(result).toHaveProperty('withScopedTransactionById');
		});
	});
});
