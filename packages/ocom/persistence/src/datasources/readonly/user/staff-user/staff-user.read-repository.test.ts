import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';

import type { Domain } from '@ocom/domain';
import type { StaffUser, StaffUserModelType } from '@ocom/data-sources-mongoose-models/user/staff-user';
import type { ModelsContext } from '../../../../index.ts';
import { StaffUserConverter } from '../../../domain/user/staff-user/staff-user.domain-adapter.ts';
import { getStaffUserReadRepository } from './staff-user.read-repository.ts';
import type { StaffUserReadRepository } from './staff-user.read-repository.ts';

const test = { for: describeFeature };

vi.mock('../../../domain/user/staff-user/staff-user.domain-adapter.ts', () => ({
	StaffUserConverter: vi.fn(),
}));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/staff-user.read-repository.feature'));

function makeMockPassport() {
	return {
		user: {
			forStaffUser: vi.fn(() => ({
				determineIf: vi.fn(() => true),
			})),
		},
	} as unknown as Domain.Passport;
}

function makeMockStaffUserDocument() {
	return {
		_id: 'doc-id',
		id: 'doc-id',
		externalId: 'ext-abc',
		firstName: 'Alice',
		lastName: 'Smith',
		email: 'alice@example.com',
	} as unknown as StaffUser;
}

function makeMockModel(doc: StaffUser | null) {
	return {
		findOne: vi.fn().mockReturnValue({
			populate: vi.fn().mockReturnValue({
				exec: vi.fn().mockResolvedValue(doc),
			}),
		}),
	} as unknown as StaffUserModelType;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let models: ModelsContext;
	let passport: Domain.Passport;
	let repository: StaffUserReadRepository;
	let mockStaffUserDoc: StaffUser;
	let result: Domain.Contexts.User.StaffUser.StaffUserEntityReference | null | unknown;
	let mockConverter: { toDomain: ReturnType<typeof vi.fn> };
	let thrownError: unknown;

	BeforeEachScenario(() => {
		passport = makeMockPassport();
		mockStaffUserDoc = makeMockStaffUserDocument();
		thrownError = undefined;
		result = undefined;

		mockConverter = {
			toDomain: vi.fn((_doc: StaffUser, _passport: Domain.Passport) => ({
				id: mockStaffUserDoc.id,
				externalId: mockStaffUserDoc.externalId,
			})),
		};

		vi.mocked(StaffUserConverter).mockImplementation(function MockStaffUserConverter() {
			return mockConverter as unknown as StaffUserConverter;
		});
	});

	Scenario('Creating StaffUserReadRepository throws when StaffUser model is missing', ({ Given, When, Then }) => {
		Given('models context does not contain a StaffUser model', () => {
			models = {} as ModelsContext;
		});
		When('I call getStaffUserReadRepository with those models and a passport', () => {
			try {
				repository = getStaffUserReadRepository(models, passport);
			} catch (err) {
				thrownError = err;
			}
		});
		Then('it should throw an error with message "StaffUser model is not available in the mongoose context"', () => {
			expect(thrownError).toBeInstanceOf(Error);
			expect((thrownError as Error).message).toBe('StaffUser model is not available in the mongoose context');
		});
	});

	Scenario('Creating StaffUserReadRepository succeeds when StaffUser model is present', ({ Given, When, Then, And }) => {
		Given('models context contains a StaffUser model', () => {
			models = { StaffUser: makeMockModel(mockStaffUserDoc) } as unknown as ModelsContext;
		});
		When('I call getStaffUserReadRepository with those models and a passport', () => {
			repository = getStaffUserReadRepository(models, passport);
		});
		Then('I should receive a StaffUserReadRepository instance', () => {
			expect(repository).toBeDefined();
		});
		And('the repository should have a getByExternalId method', () => {
			expect(typeof repository.getByExternalId).toBe('function');
		});
		And('the repository should have a getByEmail method', () => {
			expect(typeof repository.getByEmail).toBe('function');
		});
	});

	Scenario('getByExternalId returns entity when document is found', ({ Given, When, Then, And }) => {
		Given('a StaffUser document exists with externalId "ext-abc"', () => {
			models = { StaffUser: makeMockModel(mockStaffUserDoc) } as unknown as ModelsContext;
			repository = getStaffUserReadRepository(models, passport);
		});
		When('I call getByExternalId with "ext-abc"', async () => {
			result = await repository.getByExternalId('ext-abc');
		});
		Then('I should receive a StaffUserEntityReference object', () => {
			expect(result).toBeDefined();
			expect(result).not.toBeNull();
		});
		And('the converter toDomain should have been called with the document and passport', () => {
			expect(mockConverter.toDomain).toHaveBeenCalledWith(mockStaffUserDoc, passport);
		});
	});

	Scenario('getByExternalId returns null when no document is found', ({ Given, When, Then }) => {
		Given('no StaffUser document exists with externalId "missing-ext"', () => {
			models = { StaffUser: makeMockModel(null) } as unknown as ModelsContext;
			repository = getStaffUserReadRepository(models, passport);
		});
		When('I call getByExternalId with "missing-ext"', async () => {
			result = await repository.getByExternalId('missing-ext');
		});
		Then('I should receive null', () => {
			expect(result).toBeNull();
		});
	});

	Scenario('getByEmail returns entity when document is found', ({ Given, When, Then, And }) => {
		Given('a StaffUser document exists with email "alice@example.com"', () => {
			models = { StaffUser: makeMockModel(mockStaffUserDoc) } as unknown as ModelsContext;
			repository = getStaffUserReadRepository(models, passport);
		});
		When('I call getByEmail with "alice@example.com"', async () => {
			result = await repository.getByEmail('alice@example.com');
		});
		Then('I should receive a StaffUserEntityReference object', () => {
			expect(result).toBeDefined();
			expect(result).not.toBeNull();
		});
		And('the converter toDomain should have been called with the document and passport', () => {
			expect(mockConverter.toDomain).toHaveBeenCalledWith(mockStaffUserDoc, passport);
		});
	});

	Scenario('getByEmail returns null when no document is found', ({ Given, When, Then }) => {
		Given('no StaffUser document exists with email "missing@example.com"', () => {
			models = { StaffUser: makeMockModel(null) } as unknown as ModelsContext;
			repository = getStaffUserReadRepository(models, passport);
		});
		When('I call getByEmail with "missing@example.com"', async () => {
			result = await repository.getByEmail('missing@example.com');
		});
		Then('I should receive null', () => {
			expect(result).toBeNull();
		});
	});
});
