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
		isPropertyNameTaken: ReturnType<typeof vi.fn>;
	};
	let memberReadRepository: {
		getByIdWithRole: ReturnType<typeof vi.fn>;
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
			isPropertyNameTaken: vi.fn(async () => false),
		};
		memberReadRepository = {
			getByIdWithRole: vi.fn(),
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
				Community: {
					Member: {
						MemberReadRepo: memberReadRepository,
					},
				},
				Property: {
					Property: {
						PropertyReadRepo: propertyReadRepository,
					},
				},
			},
		} as unknown as DataSources;
	});

	function makePropertyAggregate() {
		const setCalls: Record<string, unknown> = {};
		const listingDetailSets: Record<string, unknown> = {};
		const addressSets: Record<string, string>[] = [];
		const bedroomAdds: Record<string, unknown>[] = [];
		const amenityAdds: Record<string, unknown>[] = [];
		const removedBedrooms: unknown[] = [];
		const removedAmenities: unknown[] = [];
		const existingBedroom = { props: { id: 'bedroom-1', roomName: 'Old Room', bedDescriptions: ['Queen'] } };
		const existingAmenity = { props: { id: 'amenity-1', category: 'Old Category', amenities: ['Old Amenity'] } };
		const currentAddress = {
			streetNumber: '1',
			streetName: 'Old St',
			municipality: 'Old Town',
			municipalitySubdivision: 'Old Subdivision',
			localName: 'Old Local',
			countrySecondarySubdivision: 'Old Secondary',
			countryTertiarySubdivision: 'Old Tertiary',
			countrySubdivision: 'OS',
			countrySubdivisionName: 'Old State',
			postalCode: '00000',
			extendedPostalCode: '00000-0000',
			countryCode: 'OC',
			country: 'Oldland',
			countryCodeISO3: 'OLD',
			freeformAddress: '1 Old St, Old Town',
			streetNameAndNumber: '1 Old St',
			routeNumbers: 'R1',
			crossStreet: 'Old Cross',
		};
		const listingDetail = {
			bedroomDetails: [existingBedroom],
			additionalAmenities: [existingAmenity],
			requestRemoveBedroom: vi.fn((props: unknown) => {
				removedBedrooms.push(props);
			}),
			requestNewBedroom: vi.fn(() => {
				const added: Record<string, unknown> = {};
				bedroomAdds.push(added);
				return {
					set roomName(value: unknown) {
						added['roomName'] = value;
					},
					set bedDescriptions(value: unknown) {
						added['bedDescriptions'] = value;
					},
				};
			}),
			requestRemoveAdditionalAmenity: vi.fn((props: unknown) => {
				removedAmenities.push(props);
			}),
			requestNewAdditionalAmenity: vi.fn(() => {
				const added: Record<string, unknown> = {};
				amenityAdds.push(added);
				return {
					set category(value: unknown) {
						added['category'] = value;
					},
					set amenities(value: unknown) {
						added['amenities'] = value;
					},
				};
			}),
		};
		for (const field of [
			'price',
			'rentHigh',
			'rentLow',
			'lease',
			'maxGuests',
			'bedrooms',
			'bathrooms',
			'squareFeet',
			'yearBuilt',
			'lotSize',
			'description',
			'amenities',
			'images',
			'video',
			'floorPlan',
			'floorPlanImages',
			'listingAgent',
			'listingAgentPhone',
			'listingAgentEmail',
			'listingAgentWebsite',
			'listingAgentCompany',
			'listingAgentCompanyPhone',
			'listingAgentCompanyEmail',
			'listingAgentCompanyWebsite',
			'listingAgentCompanyAddress',
		]) {
			Object.defineProperty(listingDetail, field, {
				set(value: unknown) {
					listingDetailSets[field] = value;
				},
			});
		}
		const property = {
			id: 'property-1',
			setCalls,
			listingDetailSets,
			addressSets,
			bedroomAdds,
			amenityAdds,
			removedBedrooms,
			removedAmenities,
			existingBedroom,
			existingAmenity,
			currentAddress,
			assertCanManageProperties: vi.fn(),
			community: { id: 'community-1' },
			get propertyName() {
				return 'Current Property Name';
			},
			set propertyName(value: unknown) {
				setCalls['propertyName'] = value;
			},
			set propertyType(value: unknown) {
				setCalls['propertyType'] = value;
			},
			set listedForSale(value: unknown) {
				setCalls['listedForSale'] = value;
			},
			set listedForRent(value: unknown) {
				setCalls['listedForRent'] = value;
			},
			set listedForLease(value: unknown) {
				setCalls['listedForLease'] = value;
			},
			set listedInDirectory(value: unknown) {
				setCalls['listedInDirectory'] = value;
			},
			set tags(value: unknown) {
				setCalls['tags'] = value;
			},
			set owner(value: unknown) {
				setCalls['owner'] = value;
			},
			location: {
				get address() {
					return currentAddress;
				},
				set address(value: Record<string, string>) {
					addressSets.push(value);
				},
			},
			listingDetail,
		};
		return property;
	}

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

		it('applies the remaining full-field set within the same transaction as the new instance', async () => {
			const community = { id: 'community-1' };
			const property = makePropertyAggregate();
			const member = { id: 'member-1', communityId: 'community-1' };
			communityRepository.get.mockResolvedValue(community);
			propertyRepository.getNewInstance.mockResolvedValue(property);
			propertyRepository.save.mockResolvedValue(property);
			memberReadRepository.getByIdWithRole.mockResolvedValue(member);

			const result = await create(dataSources)({
				propertyName: 'Grand Pavilion',
				communityId: 'community-1',
				propertyType: 'house',
				ownerId: 'member-1',
				listedForSale: true,
				listedInDirectory: true,
				tags: ['waterfront', 'pool'],
				location: { address: { streetNumber: '42', streetName: 'Shoreline Dr' } },
				listingDetail: { price: 1250000, bathrooms: 3.5 },
			});

			expect(propertyRepository.getNewInstance).toHaveBeenCalledWith('Grand Pavilion', community);
			expect(property.setCalls).toEqual({
				propertyType: 'house',
				listedForSale: true,
				listedInDirectory: true,
				tags: ['waterfront', 'pool'],
				owner: member,
			});
			expect(property.addressSets[0]).toMatchObject({ streetNumber: '42', streetName: 'Shoreline Dr', municipality: 'Old Town' });
			expect((property.listingDetailSets['price'] as { valueOf(): number }).valueOf()).toBe(1250000);
			expect((property.listingDetailSets['bathrooms'] as { valueOf(): number }).valueOf()).toBe(3.5);
			expect(propertyRepository.save).toHaveBeenCalledWith(property);
			expect(result).toBe(property);
		});

		it('rejects the create when an owner from another community is provided', async () => {
			const community = { id: 'community-1' };
			const property = makePropertyAggregate();
			communityRepository.get.mockResolvedValue(community);
			propertyRepository.getNewInstance.mockResolvedValue(property);
			propertyRepository.save.mockResolvedValue(property);
			memberReadRepository.getByIdWithRole.mockResolvedValue({ id: 'member-2', communityId: 'other-community' });

			await expect(
				create(dataSources)({
					propertyName: 'Grand Pavilion',
					communityId: 'community-1',
					ownerId: 'member-2',
				}),
			).rejects.toThrow("Owner member does not belong to the property's community");

			expect(propertyRepository.save).not.toHaveBeenCalled();
		});

		it('rejects an unauthorized caller before any community or name lookups', async () => {
			// The pre-authorization prevents probing community existence or
			// property-name availability without the manage permission.
			propertyVisaPermissions.canManageProperties = false;

			await expect(create(dataSources)({ propertyName: 'Dune Cottage', communityId: 'community-1' })).rejects.toThrow('Unauthorized');

			expect(communityRepository.get).not.toHaveBeenCalled();
			expect(propertyReadRepository.isPropertyNameTaken).not.toHaveBeenCalled();
			expect(propertyRepository.save).not.toHaveBeenCalled();
		});

		it('throws the friendly duplicate-name message when an active property already has the name', async () => {
			const community = { id: 'community-1' };
			communityRepository.get.mockResolvedValue(community);
			propertyReadRepository.isPropertyNameTaken.mockResolvedValue(true);

			await expect(create(dataSources)({ propertyName: 'Dune Cottage', communityId: 'community-1' })).rejects.toThrow('A property with this name already exists');

			expect(propertyReadRepository.isPropertyNameTaken).toHaveBeenCalledWith('community-1', 'Dune Cottage');
			expect(propertyRepository.getNewInstance).not.toHaveBeenCalled();
			expect(propertyRepository.save).not.toHaveBeenCalled();
		});

		it('creates the property when the name is only taken by a soft-deleted property', async () => {
			// The read repository excludes soft-deleted properties from the availability
			// check, so a removed property's name is reported as available again.
			const community = { id: 'community-1' };
			const newProperty = { id: 'property-1', propertyName: 'Phoenix Cottage' };
			communityRepository.get.mockResolvedValue(community);
			propertyRepository.getNewInstance.mockResolvedValue(newProperty);
			propertyRepository.save.mockResolvedValue(newProperty);
			propertyReadRepository.isPropertyNameTaken.mockResolvedValue(false);

			const result = await create(dataSources)({ propertyName: 'Phoenix Cottage', communityId: 'community-1' });

			expect(propertyReadRepository.isPropertyNameTaken).toHaveBeenCalledWith('community-1', 'Phoenix Cottage');
			expect(propertyRepository.save).toHaveBeenCalledWith(newProperty);
			expect(result).toBe(newProperty);
		});
	});

	describe('update', () => {
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

		it('forwards an explicit null propertyType so the value can be cleared', async () => {
			const property = makePropertyAggregate();
			propertyRepository.getById.mockResolvedValue(property);
			propertyRepository.save.mockResolvedValue(property);

			await update(dataSources)({ id: 'property-1', propertyType: null });

			expect(property.setCalls).toEqual({ propertyType: null });
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
			expect(property.listingDetailSets['bedrooms']).toBeInstanceOf(Domain.Contexts.Property.Property.ListingDetailValueObjects.Bedrooms);
			expect((property.listingDetailSets['bedrooms'] as { valueOf(): number }).valueOf()).toBe(3);
			expect((property.listingDetailSets['bathrooms'] as { valueOf(): number }).valueOf()).toBe(2.5);
			expect((property.listingDetailSets['squareFeet'] as { valueOf(): number }).valueOf()).toBe(1750);
		});

		it('applies explicit nulls as value objects to clear listing detail fields', async () => {
			const property = makePropertyAggregate();
			propertyRepository.getById.mockResolvedValue(property);
			propertyRepository.save.mockResolvedValue(property);

			await update(dataSources)({
				id: 'property-1',
				listingDetail: { bedrooms: null, bathrooms: null, squareFeet: null },
			});

			expect((property.listingDetailSets['bedrooms'] as { valueOf(): number | null }).valueOf()).toBeNull();
			expect((property.listingDetailSets['bathrooms'] as { valueOf(): number | null }).valueOf()).toBeNull();
			expect((property.listingDetailSets['squareFeet'] as { valueOf(): number | null }).valueOf()).toBeNull();
			expect(propertyRepository.save).toHaveBeenCalledWith(property);
		});

		it('applies toggles, tags, address merges, and extended listing detail fields', async () => {
			const property = makePropertyAggregate();
			propertyRepository.getById.mockResolvedValue(property);
			propertyRepository.save.mockResolvedValue(property);

			await update(dataSources)({
				id: 'property-1',
				listedForSale: true,
				listedForRent: false,
				listedForLease: true,
				listedInDirectory: true,
				tags: ['orchard', 'barn'],
				location: { address: { streetNumber: '500', streetName: 'Main St', municipality: 'Sunnyvale', countrySubdivision: 'CA', postalCode: '94086', country: 'USA' } },
				listingDetail: {
					price: 725000,
					rentHigh: 3900,
					rentLow: 3200,
					lease: 3600,
					maxGuests: 6,
					yearBuilt: 1976,
					lotSize: 5400,
					description: 'Bright duplex near the marina',
					amenities: ['Pool', 'Gym'],
					images: ['https://cdn.example.com/front.jpg'],
					video: 'https://cdn.example.com/tour.mp4',
					floorPlan: 'https://cdn.example.com/plan.pdf',
					floorPlanImages: ['https://cdn.example.com/floor1.png'],
					listingAgent: 'Jane Realtor',
					listingAgentEmail: 'jane@realty.example',
					listingAgentCompanyAddress: '1 Main St, Half Moon Bay, CA',
				},
			});

			expect(property.setCalls).toEqual({
				listedForSale: true,
				listedForRent: false,
				listedForLease: true,
				listedInDirectory: true,
				tags: ['orchard', 'barn'],
			});
			expect(property.addressSets).toHaveLength(1);
			// Provided fields are applied, unspecified ones keep the stored values.
			expect(property.addressSets[0]).toMatchObject({
				streetNumber: '500',
				streetName: 'Main St',
				municipality: 'Sunnyvale',
				countrySubdivision: 'CA',
				postalCode: '94086',
				country: 'USA',
				localName: 'Old Local',
				freeformAddress: '1 Old St, Old Town',
			});
			const voValue = (field: string) => (property.listingDetailSets[field] as { valueOf(): unknown }).valueOf();
			expect(voValue('price')).toBe(725000);
			expect(voValue('rentHigh')).toBe(3900);
			expect(voValue('rentLow')).toBe(3200);
			expect(voValue('lease')).toBe(3600);
			expect(voValue('maxGuests')).toBe(6);
			expect(voValue('yearBuilt')).toBe(1976);
			expect(voValue('lotSize')).toBe(5400);
			expect(voValue('description')).toBe('Bright duplex near the marina');
			expect(voValue('amenities')).toEqual(['Pool', 'Gym']);
			expect(voValue('images')).toEqual(['https://cdn.example.com/front.jpg']);
			expect(voValue('video')).toBe('https://cdn.example.com/tour.mp4');
			expect(voValue('floorPlan')).toBe('https://cdn.example.com/plan.pdf');
			expect(voValue('floorPlanImages')).toEqual(['https://cdn.example.com/floor1.png']);
			expect(voValue('listingAgent')).toBe('Jane Realtor');
			expect(voValue('listingAgentEmail')).toBe('jane@realty.example');
			expect(voValue('listingAgentCompanyAddress')).toBe('1 Main St, Half Moon Bay, CA');
			expect(propertyRepository.save).toHaveBeenCalledWith(property);
		});

		it('replaces bedroom details and additional amenities wholesale', async () => {
			const property = makePropertyAggregate();
			propertyRepository.getById.mockResolvedValue(property);
			propertyRepository.save.mockResolvedValue(property);

			await update(dataSources)({
				id: 'property-1',
				listingDetail: {
					bedroomDetails: [{ roomName: 'Primary Suite', bedDescriptions: ['King', 'Crib'] }],
					additionalAmenities: [{ category: 'Outdoor', amenities: ['Fire Pit', 'BBQ'] }],
				},
			});

			expect(property.removedBedrooms).toEqual([property.existingBedroom.props]);
			expect(property.removedAmenities).toEqual([property.existingAmenity.props]);
			expect(property.bedroomAdds).toHaveLength(1);
			expect((property.bedroomAdds[0]?.['roomName'] as { valueOf(): string }).valueOf()).toBe('Primary Suite');
			expect((property.bedroomAdds[0]?.['bedDescriptions'] as { valueOf(): string[] }).valueOf()).toEqual(['King', 'Crib']);
			expect(property.amenityAdds).toHaveLength(1);
			expect((property.amenityAdds[0]?.['category'] as { valueOf(): string }).valueOf()).toBe('Outdoor');
			expect((property.amenityAdds[0]?.['amenities'] as { valueOf(): string[] }).valueOf()).toEqual(['Fire Pit', 'BBQ']);
			expect(propertyRepository.save).toHaveBeenCalledWith(property);
		});

		it('assigns the owner when the member belongs to the property community', async () => {
			const property = makePropertyAggregate();
			const member = { id: 'member-1', communityId: 'community-1' };
			propertyRepository.getById.mockResolvedValue(property);
			propertyRepository.save.mockResolvedValue(property);
			memberReadRepository.getByIdWithRole.mockResolvedValue(member);

			await update(dataSources)({ id: 'property-1', ownerId: 'member-1' });

			expect(memberReadRepository.getByIdWithRole).toHaveBeenCalledWith('member-1');
			expect(property.setCalls).toEqual({ owner: member });
			expect(propertyRepository.save).toHaveBeenCalledWith(property);
		});

		it('clears the owner on an explicit null without resolving any member', async () => {
			const property = makePropertyAggregate();
			propertyRepository.getById.mockResolvedValue(property);
			propertyRepository.save.mockResolvedValue(property);

			await update(dataSources)({ id: 'property-1', ownerId: null });

			expect(memberReadRepository.getByIdWithRole).not.toHaveBeenCalled();
			expect(property.setCalls).toEqual({ owner: null });
			expect(propertyRepository.save).toHaveBeenCalledWith(property);
		});

		it('rejects an owner member that belongs to another community', async () => {
			const property = makePropertyAggregate();
			propertyRepository.getById.mockResolvedValue(property);
			propertyRepository.save.mockResolvedValue(property);
			memberReadRepository.getByIdWithRole.mockResolvedValue({ id: 'member-2', communityId: 'other-community' });

			await expect(update(dataSources)({ id: 'property-1', ownerId: 'member-2' })).rejects.toThrow("Owner member does not belong to the property's community");

			expect(property.setCalls).toEqual({});
			expect(propertyRepository.save).not.toHaveBeenCalled();
		});

		it('rejects an owner member that cannot be found', async () => {
			const property = makePropertyAggregate();
			propertyRepository.getById.mockResolvedValue(property);
			propertyRepository.save.mockResolvedValue(property);
			memberReadRepository.getByIdWithRole.mockResolvedValue(null);

			await expect(update(dataSources)({ id: 'property-1', ownerId: 'missing-member' })).rejects.toThrow('Owner member with id missing-member not found');

			expect(propertyRepository.save).not.toHaveBeenCalled();
		});

		it('propagates the bathrooms half-step violation from the value object', async () => {
			const property = makePropertyAggregate();
			propertyRepository.getById.mockResolvedValue(property);
			propertyRepository.save.mockResolvedValue(property);

			await expect(update(dataSources)({ id: 'property-1', listingDetail: { bathrooms: 1.77 } })).rejects.toThrow('Bathrooms must be in increments of 0.5');

			expect(propertyRepository.save).not.toHaveBeenCalled();
		});

		it('propagates domain errors from the aggregate', async () => {
			propertyRepository.getById.mockResolvedValue({
				assertCanManageProperties: vi.fn(),
				community: { id: 'community-1' },
				get propertyName() {
					return 'Old';
				},
				set propertyName(_value: string) {
					throw new Error('You do not have permission to update this property');
				},
			});

			await expect(update(dataSources)({ id: 'property-1', propertyName: 'New' })).rejects.toThrow('You do not have permission to update this property');
		});

		it('throws the friendly duplicate-name message when renaming to a name taken by another active property', async () => {
			const property = makePropertyAggregate();
			propertyRepository.getById.mockResolvedValue(property);
			propertyRepository.save.mockResolvedValue(property);
			propertyReadRepository.isPropertyNameTaken.mockResolvedValue(true);

			await expect(update(dataSources)({ id: 'property-1', propertyName: 'Anchor Cottage' })).rejects.toThrow('A property with this name already exists');

			expect(propertyReadRepository.isPropertyNameTaken).toHaveBeenCalledWith('community-1', 'Anchor Cottage');
			expect(property.setCalls).toEqual({});
			expect(propertyRepository.save).not.toHaveBeenCalled();
		});

		it('does not pre-check the name when the update keeps the current property name', async () => {
			const property = makePropertyAggregate();
			propertyRepository.getById.mockResolvedValue(property);
			propertyRepository.save.mockResolvedValue(property);
			// Would reject the update if the availability check were consulted.
			propertyReadRepository.isPropertyNameTaken.mockResolvedValue(true);

			await update(dataSources)({ id: 'property-1', propertyName: 'Current Property Name' });

			expect(propertyReadRepository.isPropertyNameTaken).not.toHaveBeenCalled();
			expect(property.setCalls).toEqual({ propertyName: 'Current Property Name' });
			expect(propertyRepository.save).toHaveBeenCalledWith(property);
		});

		it('does not pre-check the name when the update omits propertyName', async () => {
			const property = makePropertyAggregate();
			propertyRepository.getById.mockResolvedValue(property);
			propertyRepository.save.mockResolvedValue(property);
			propertyReadRepository.isPropertyNameTaken.mockResolvedValue(true);

			await update(dataSources)({ id: 'property-1', propertyType: 'condo' });

			expect(propertyReadRepository.isPropertyNameTaken).not.toHaveBeenCalled();
			expect(property.setCalls).toEqual({ propertyType: 'condo' });
			expect(propertyRepository.save).toHaveBeenCalledWith(property);
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

		it('queryById returns null when the passport denies property management, indistinguishable from not found', async () => {
			// MemberPropertyVisa denies both for a role without canManageProperties and
			// when the property belongs to a community other than the request's current
			// one. Returning null (rather than throwing) keeps unauthorized lookups
			// indistinguishable from missing ids, so property ids of other communities
			// cannot be probed for existence.
			propertyReadRepository.getById.mockResolvedValue({ id: 'property-1' });
			propertyVisaPermissions.canManageProperties = false;

			await expect(queryById(dataSources)({ id: 'property-1' })).resolves.toBeNull();
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
