import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';

import type { Domain } from '@ocom/domain';
import type { StaffRole, StaffRoleModelType } from '@ocom/data-sources-mongoose-models/role/staff-role';
import type { ModelsContext } from '../../../../index.ts';
import { StaffRoleConverter } from '../../../domain/user/staff-role/staff-role.domain-adapter.ts';
import { getStaffRoleReadRepository } from './staff-role.read-repository.ts';
import type { StaffRoleReadRepository } from './staff-role.read-repository.ts';

const test = { for: describeFeature };

vi.mock('../../../domain/user/staff-role/staff-role.domain-adapter.ts', () => ({
	StaffRoleConverter: vi.fn(),
}));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/staff-role.read-repository.feature'));

function makeMockPassport() {
	return {} as unknown as Domain.Passport;
}

function makeMockStaffRoleDocument(overrides: Partial<StaffRole> = {}) {
	return {
		_id: 'role-001',
		id: 'role-001',
		roleName: 'Admin',
		isDefault: false,
		roleType: 'staff',
		...overrides,
	} as unknown as StaffRole;
}

function makeMockModelForFind(docs: StaffRole[]) {
	return {
		find: vi.fn().mockReturnValue({
			exec: vi.fn().mockResolvedValue(docs),
		}),
		findById: vi.fn().mockReturnValue({
			exec: vi.fn().mockResolvedValue(docs[0] ?? null),
		}),
	} as unknown as StaffRoleModelType;
}

function makeMockModelFindById(doc: StaffRole | null) {
	return {
		find: vi.fn().mockReturnValue({
			exec: vi.fn().mockResolvedValue([]),
		}),
		findById: vi.fn().mockReturnValue({
			exec: vi.fn().mockResolvedValue(doc),
		}),
	} as unknown as StaffRoleModelType;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let models: ModelsContext;
	let passport: Domain.Passport;
	let repository: StaffRoleReadRepository;
	let mockDoc: StaffRole;
	let result: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | Domain.Contexts.User.StaffRole.StaffRoleEntityReference[] | null | unknown;
	let mockConverter: { toDomain: ReturnType<typeof vi.fn> };
	let thrownError: unknown;

	BeforeEachScenario(() => {
		passport = makeMockPassport();
		mockDoc = makeMockStaffRoleDocument();
		thrownError = undefined;
		result = undefined;

		mockConverter = {
			toDomain: vi.fn((_doc: StaffRole, _passport: Domain.Passport) => ({
				id: mockDoc.id,
				roleName: mockDoc.roleName,
			})),
		};

		vi.mocked(StaffRoleConverter).mockImplementation(function MockStaffRoleConverter() {
			return mockConverter as unknown as StaffRoleConverter;
		});
	});

	Scenario('Creating StaffRoleReadRepository throws when StaffRole model is missing', ({ Given, When, Then }) => {
		Given('models context does not contain a StaffRole model', () => {
			models = {} as ModelsContext;
		});
		When('I call getStaffRoleReadRepository with those models and a passport', () => {
			try {
				repository = getStaffRoleReadRepository(models, passport);
			} catch (err) {
				thrownError = err;
			}
		});
		Then('it should throw an error with message "StaffRole model is not available in the mongoose context"', () => {
			expect(thrownError).toBeInstanceOf(Error);
			expect((thrownError as Error).message).toBe('StaffRole model is not available in the mongoose context');
		});
	});

	Scenario('Creating StaffRoleReadRepository succeeds when StaffRole model is present', ({ Given, When, Then, And }) => {
		Given('models context contains a StaffRole model', () => {
			models = { StaffRole: makeMockModelForFind([mockDoc]) } as unknown as ModelsContext;
		});
		When('I call getStaffRoleReadRepository with those models and a passport', () => {
			repository = getStaffRoleReadRepository(models, passport);
		});
		Then('I should receive a StaffRoleReadRepository instance', () => {
			expect(repository).toBeDefined();
		});
		And('the repository should have a getAll method', () => {
			expect(typeof repository.getAll).toBe('function');
		});
		And('the repository should have a getById method', () => {
			expect(typeof repository.getById).toBe('function');
		});
	});

	Scenario('getAll returns a list of entities when documents are found', ({ Given, When, Then, And }) => {
		const secondDoc = makeMockStaffRoleDocument({ _id: 'role-002', id: 'role-002', roleName: 'User' } as unknown as Partial<StaffRole>);

		Given('StaffRole documents exist in the collection', () => {
			models = { StaffRole: makeMockModelForFind([mockDoc, secondDoc]) } as unknown as ModelsContext;
			repository = getStaffRoleReadRepository(models, passport);
		});
		When('I call getAll', async () => {
			result = await repository.getAll();
		});
		Then('I should receive an array of StaffRoleEntityReference objects', () => {
			expect(Array.isArray(result)).toBe(true);
			expect((result as unknown[]).length).toBe(2);
		});
		And('the converter toDomain should have been called for each document', () => {
			expect(mockConverter.toDomain).toHaveBeenCalledTimes(2);
			expect(mockConverter.toDomain).toHaveBeenCalledWith(mockDoc, passport);
			expect(mockConverter.toDomain).toHaveBeenCalledWith(secondDoc, passport);
		});
	});

	Scenario('getAll returns an empty array when no documents exist', ({ Given, When, Then }) => {
		Given('no StaffRole documents exist in the collection', () => {
			models = { StaffRole: makeMockModelForFind([]) } as unknown as ModelsContext;
			repository = getStaffRoleReadRepository(models, passport);
		});
		When('I call getAll', async () => {
			result = await repository.getAll();
		});
		Then('I should receive an empty array', () => {
			expect(Array.isArray(result)).toBe(true);
			expect((result as unknown[]).length).toBe(0);
		});
	});

	Scenario('getById returns an entity when a document is found', ({ Given, When, Then, And }) => {
		Given('a StaffRole document exists with id "role-001"', () => {
			models = { StaffRole: makeMockModelFindById(mockDoc) } as unknown as ModelsContext;
			repository = getStaffRoleReadRepository(models, passport);
		});
		When('I call getById with "role-001"', async () => {
			result = await repository.getById('role-001');
		});
		Then('I should receive a StaffRoleEntityReference object', () => {
			expect(result).toBeDefined();
			expect(result).not.toBeNull();
		});
		And('the converter toDomain should have been called with the document and passport', () => {
			expect(mockConverter.toDomain).toHaveBeenCalledWith(mockDoc, passport);
		});
	});

	Scenario('getById returns null when no document is found', ({ Given, When, Then }) => {
		Given('no StaffRole document exists with id "missing-id"', () => {
			models = { StaffRole: makeMockModelFindById(null) } as unknown as ModelsContext;
			repository = getStaffRoleReadRepository(models, passport);
		});
		When('I call getById with "missing-id"', async () => {
			result = await repository.getById('missing-id');
		});
		Then('I should receive null', () => {
			expect(result).toBeNull();
		});
	});
});
