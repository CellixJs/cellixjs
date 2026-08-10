import { Domain } from '@ocom/domain';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { create } from './create.ts';
import { queryByCommunityId } from './query-by-community-id.ts';
import { queryById } from './query-by-id.ts';
import { requestDelete } from './request-delete.ts';
import { update } from './update.ts';

type DataSources = Parameters<typeof create>[0];

describe('property application services', () => {
	let dataSources: DataSources;
	let communityRepository: {
		get: ReturnType<typeof vi.fn>;
	};
	let propertyRepository: {
		getNewInstance: ReturnType<typeof vi.fn>;
		getById: ReturnType<typeof vi.fn>;
		save: ReturnType<typeof vi.fn>;
	};
	let propertyReadRepository: {
		getById: ReturnType<typeof vi.fn>;
		getByCommunityId: ReturnType<typeof vi.fn>;
	};
	let propertyVisaPermissions: { canManageProperties: boolean; canEditOwnProperty: boolean; isEditingOwnProperty: boolean; isSystemAccount: boolean };
	let forProperty: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		communityRepository = {
			get: vi.fn(),
		};
		propertyRepository = {
			getNewInstance: vi.fn(),
			getById: vi.fn(),
			save: vi.fn(),
		};
		propertyReadRepository = {
			getById: vi.fn(),
			getByCommunityId: vi.fn(),
		};
		// Mirrors MemberPropertyVisa: the request passport evaluates the predicate
		// against the member's permissions in the current (hint-scoped) community.
		propertyVisaPermissions = {
			canManageProperties: true,
			canEditOwnProperty: false,
			isEditingOwnProperty: false,
			isSystemAccount: false,
		};
		forProperty = vi.fn(() => ({
			determineIf: (fn: (permissions: typeof propertyVisaPermissions) => boolean) => fn(propertyVisaPermissions),
		}));

		dataSources = {
			passport: {
				property: {
					get forProperty() {
						return forProperty;
					},
				},
			},
			domainDataSource: {
				Community: {
					Community: {
						CommunityUnitOfWork: {
							withScopedTransaction: vi.fn(async (callback: (repo: typeof communityRepository) => Promise<void>) => callback(communityRepository)),
						},
					},
				},
				Property: {
					Property: {
						PropertyUnitOfWork: {
							withScopedTransaction: vi.fn(async (callback: (repo: typeof propertyRepository) => Promise<void>) => callback(propertyRepository)),
						},
					},
				},
			},
			readonlyDataSource: {
				Property: {
					Property: {
						PropertyReadRepo: propertyReadRepository,
					},
				},
			},
		} as unknown as DataSources;
	});

	describe('create', () => {
		it('loads the community and creates the property through the unit of work', async () => {
			const community = { id: 'community-1' };
			const newProperty = { id: 'property-1', propertyName: 'P1' };
			communityRepository.get.mockResolvedValue(community);
			propertyRepository.getNewInstance.mockResolvedValue(newProperty);
			propertyRepository.save.mockResolvedValue(newProperty);

			const result = await create(dataSources)({ propertyName: 'P1', communityId: 'community-1' });

			expect(communityRepository.get).toHaveBeenCalledWith('community-1');
			expect(propertyRepository.getNewInstance).toHaveBeenCalledWith('P1', community);
			expect(propertyRepository.save).toHaveBeenCalledWith(newProperty);
			expect(result).toBe(newProperty);
		});

		it('throws when the community cannot be found', async () => {
			communityRepository.get.mockResolvedValue(undefined);

			await expect(create(dataSources)({ propertyName: 'P1', communityId: 'missing' })).rejects.toThrow('Community not found for id missing');
			expect(propertyRepository.getNewInstance).not.toHaveBeenCalled();
		});
	});

	describe('update', () => {
		function makePropertyAggregate() {
			const setCalls: { propertyName?: unknown; propertyType?: unknown } = {};
			const listingDetailSets: { bedrooms?: unknown; bathrooms?: unknown; squareFeet?: unknown } = {};
			const property = {
				id: 'property-1',
				setCalls,
				listingDetailSets,
				assertCanManageProperties: vi.fn(),
				set propertyName(value: unknown) {
					setCalls.propertyName = value;
				},
				set propertyType(value: unknown) {
					setCalls.propertyType = value;
				},
				listingDetail: {
					set bedrooms(value: unknown) {
						listingDetailSets.bedrooms = value;
					},
					set bathrooms(value: unknown) {
						listingDetailSets.bathrooms = value;
					},
					set squareFeet(value: unknown) {
						listingDetailSets.squareFeet = value;
					},
				},
			};
			return property;
		}

		it('applies only the provided fields', async () => {
			const property = makePropertyAggregate();
			propertyRepository.getById.mockResolvedValue(property);
			propertyRepository.save.mockResolvedValue(property);

			await update(dataSources)({ id: 'property-1', propertyType: 'condo' });

			expect(property.assertCanManageProperties).toHaveBeenCalled();
			expect(property.setCalls).toEqual({ propertyType: 'condo' });
			expect(property.listingDetailSets).toEqual({});
			expect(propertyRepository.save).toHaveBeenCalledWith(property);
		});

		it('rejects listing-detail-only updates when the actor cannot manage properties', async () => {
			const property = makePropertyAggregate();
			property.assertCanManageProperties.mockImplementation(() => {
				throw new Error('You do not have permission to manage properties');
			});
			propertyRepository.getById.mockResolvedValue(property);
			propertyRepository.save.mockResolvedValue(property);

			await expect(update(dataSources)({ id: 'property-1', listingDetail: { bedrooms: 5 } })).rejects.toThrow('You do not have permission to manage properties');

			expect(property.listingDetailSets).toEqual({});
			expect(propertyRepository.save).not.toHaveBeenCalled();
		});

		it('applies listing detail fields as value objects', async () => {
			const property = makePropertyAggregate();
			propertyRepository.getById.mockResolvedValue(property);
			propertyRepository.save.mockResolvedValue(property);

			await update(dataSources)({
				id: 'property-1',
				propertyName: 'New Name',
				listingDetail: { bedrooms: 3, bathrooms: 2.5, squareFeet: 1750 },
			});

			expect(property.setCalls).toEqual({ propertyName: 'New Name' });
			expect(property.listingDetailSets.bedrooms).toBeInstanceOf(Domain.Contexts.Property.Property.ListingDetailValueObjects.Bedrooms);
			expect((property.listingDetailSets.bedrooms as { valueOf(): number }).valueOf()).toBe(3);
			expect((property.listingDetailSets.bathrooms as { valueOf(): number }).valueOf()).toBe(2.5);
			expect((property.listingDetailSets.squareFeet as { valueOf(): number }).valueOf()).toBe(1750);
		});

		it('applies explicit nulls as value objects to clear listing detail fields', async () => {
			const property = makePropertyAggregate();
			propertyRepository.getById.mockResolvedValue(property);
			propertyRepository.save.mockResolvedValue(property);

			await update(dataSources)({
				id: 'property-1',
				listingDetail: { bedrooms: null, bathrooms: null, squareFeet: null },
			});

			expect((property.listingDetailSets.bedrooms as { valueOf(): number | null }).valueOf()).toBeNull();
			expect((property.listingDetailSets.bathrooms as { valueOf(): number | null }).valueOf()).toBeNull();
			expect((property.listingDetailSets.squareFeet as { valueOf(): number | null }).valueOf()).toBeNull();
			expect(propertyRepository.save).toHaveBeenCalledWith(property);
		});

		it('propagates domain errors from the aggregate', async () => {
			propertyRepository.getById.mockResolvedValue({
				assertCanManageProperties: vi.fn(),
				get propertyName() {
					return 'Old';
				},
				set propertyName(_value: string) {
					throw new Error('You do not have permission to update this property');
				},
			});

			await expect(update(dataSources)({ id: 'property-1', propertyName: 'New' })).rejects.toThrow('You do not have permission to update this property');
		});
	});

	describe('requestDelete', () => {
		it('requests deletion on the aggregate and saves it', async () => {
			const requestDeleteFn = vi.fn();
			const property = { id: 'property-1', requestDelete: requestDeleteFn };
			propertyRepository.getById.mockResolvedValue(property);
			propertyRepository.save.mockResolvedValue(property);

			const result = await requestDelete(dataSources)({ id: 'property-1' });

			expect(requestDeleteFn).toHaveBeenCalledTimes(1);
			expect(propertyRepository.save).toHaveBeenCalledWith(property);
			expect(result).toBe(property);
		});

		it('propagates permission errors from the aggregate', async () => {
			propertyRepository.getById.mockResolvedValue({
				requestDelete: () => {
					throw new Error('You do not have permission to delete this property');
				},
			});

			await expect(requestDelete(dataSources)({ id: 'property-1' })).rejects.toThrow('You do not have permission to delete this property');
		});
	});

	describe('queries', () => {
		it('queryById delegates to the read repository when the passport grants property management', async () => {
			propertyReadRepository.getById.mockResolvedValue({ id: 'property-1' });

			await expect(queryById(dataSources)({ id: 'property-1' })).resolves.toEqual({ id: 'property-1' });
			expect(propertyReadRepository.getById).toHaveBeenCalledWith('property-1');
			expect(forProperty).toHaveBeenCalledWith({ id: 'property-1' });
		});

		it('queryById returns null without consulting the visa when the property is not found', async () => {
			propertyReadRepository.getById.mockResolvedValue(null);

			await expect(queryById(dataSources)({ id: 'missing' })).resolves.toBeNull();
			expect(forProperty).not.toHaveBeenCalled();
		});

		it('queryById throws Unauthorized when the passport denies property management', async () => {
			// MemberPropertyVisa denies both for a role without canManageProperties and
			// when the property belongs to a community other than the request's current one.
			propertyReadRepository.getById.mockResolvedValue({ id: 'property-1' });
			propertyVisaPermissions.canManageProperties = false;

			await expect(queryById(dataSources)({ id: 'property-1' })).rejects.toThrow('Unauthorized');
		});

		it('queryById allows system accounts without canManageProperties', async () => {
			propertyReadRepository.getById.mockResolvedValue({ id: 'property-1' });
			propertyVisaPermissions.canManageProperties = false;
			propertyVisaPermissions.isSystemAccount = true;

			await expect(queryById(dataSources)({ id: 'property-1' })).resolves.toEqual({ id: 'property-1' });
		});

		it('queryByCommunityId delegates to the read repository when the passport grants property management', async () => {
			propertyReadRepository.getByCommunityId.mockResolvedValue([{ id: 'property-1' }]);

			await expect(queryByCommunityId(dataSources)({ communityId: 'community-1' })).resolves.toEqual([{ id: 'property-1' }]);
			expect(propertyReadRepository.getByCommunityId).toHaveBeenCalledWith('community-1');
			expect(forProperty).toHaveBeenCalledWith({ id: 'property-1' });
		});

		it('queryByCommunityId authorizes the requested community before reading any results', async () => {
			propertyVisaPermissions.canManageProperties = false;

			await expect(queryByCommunityId(dataSources)({ communityId: 'community-1' })).rejects.toThrow('Unauthorized');
			expect(propertyReadRepository.getByCommunityId).not.toHaveBeenCalled();
			expect(forProperty).toHaveBeenCalledWith({ community: { id: 'community-1' } });
		});

		it('queryByCommunityId rejects unauthorized actors even when the community has no properties', async () => {
			propertyReadRepository.getByCommunityId.mockResolvedValue([]);
			propertyVisaPermissions.canManageProperties = false;

			await expect(queryByCommunityId(dataSources)({ communityId: 'community-1' })).rejects.toThrow('Unauthorized');
		});

		it('queryByCommunityId returns an empty list for an authorized manager', async () => {
			propertyReadRepository.getByCommunityId.mockResolvedValue([]);

			await expect(queryByCommunityId(dataSources)({ communityId: 'community-1' })).resolves.toEqual([]);
			expect(forProperty).toHaveBeenCalledWith({ community: { id: 'community-1' } });
		});
	});
});
