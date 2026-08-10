import type { Property } from '@ocom/data-sources-mongoose-models/property';
import type { Domain } from '@ocom/domain';
import { describe, expect, it, vi } from 'vitest';
import type { ModelsContext } from '../../../../index.ts';
import { PropertyDataSourceImpl } from './property.data.ts';
import { PropertyReadRepositoryImpl } from './property.read-repository.ts';

vi.mock('./property.data.ts', () => ({
	PropertyDataSourceImpl: vi.fn(),
}));

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

function makeMockPropertyDoc(overrides: Partial<Property> = {}) {
	return {
		_id: '507f1f77bcf86cd799439011',
		id: '507f1f77bcf86cd799439011',
		propertyName: 'Test Property',
		community: { _id: '507f1f77bcf86cd799439012', id: '507f1f77bcf86cd799439012', name: 'Test Community' },
		isDeleted: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	} as unknown as Property;
}

function makeRepository(mockDataSource: { find: ReturnType<typeof vi.fn>; findById: ReturnType<typeof vi.fn> }) {
	vi.mocked(PropertyDataSourceImpl).mockImplementation(function MockPropertyDataSourceImpl() {
		return mockDataSource as unknown as InstanceType<typeof PropertyDataSourceImpl>;
	});
	const models = { Property: {} } as unknown as ModelsContext;
	return new PropertyReadRepositoryImpl(models, makeMockPassport());
}

describe('PropertyReadRepositoryImpl', () => {
	it('getById returns the property with community and owner populated', async () => {
		const doc = makeMockPropertyDoc();
		const mockDataSource = { find: vi.fn(), findById: vi.fn(async () => doc) };
		const repository = makeRepository(mockDataSource);

		const result = await repository.getById('507f1f77bcf86cd799439011');

		expect(mockDataSource.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011', { populateFields: ['community', 'owner'] });
		expect(result?.propertyName).toBe('Test Property');
	});

	it('getById returns null when the property is not found', async () => {
		const mockDataSource = { find: vi.fn(), findById: vi.fn(async () => null) };
		const repository = makeRepository(mockDataSource);

		await expect(repository.getById('507f1f77bcf86cd799439011')).resolves.toBeNull();
	});

	it('getById returns null when the property is soft deleted', async () => {
		const doc = makeMockPropertyDoc({ isDeleted: true });
		const mockDataSource = { find: vi.fn(), findById: vi.fn(async () => doc) };
		const repository = makeRepository(mockDataSource);

		await expect(repository.getById('507f1f77bcf86cd799439011')).resolves.toBeNull();
	});

	it('getByCommunityId excludes soft-deleted properties in the filter', async () => {
		const doc = makeMockPropertyDoc();
		const mockDataSource = { find: vi.fn(async () => [doc]), findById: vi.fn() };
		const repository = makeRepository(mockDataSource);

		const result = await repository.getByCommunityId('507f1f77bcf86cd799439012');

		expect(mockDataSource.find).toHaveBeenCalledTimes(1);
		const [filter, options] = mockDataSource.find.mock.calls[0] as unknown as [Record<string, unknown>, { populateFields: string[] }];
		expect(String(filter['community'])).toBe('507f1f77bcf86cd799439012');
		expect(filter['isDeleted']).toEqual({ $ne: true });
		expect(options.populateFields).toEqual(['community', 'owner']);
		expect(result).toHaveLength(1);
		expect(result[0]?.propertyName).toBe('Test Property');
	});
});
