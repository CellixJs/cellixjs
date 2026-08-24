import type { GraphQLResolveInfo } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import type { GraphContext } from '../context.ts';
import propertyResolvers from './property.resolvers.ts';

type ResolverFn = (parent: unknown, args: unknown, context: GraphContext, info: GraphQLResolveInfo) => Promise<unknown>;

function createContext(): GraphContext {
	return {
		applicationServices: {
			Community: {
				Member: {
					queryById: vi.fn(),
					queryByIdWithRole: vi.fn(),
					queryByIdsWithRole: vi.fn(),
				},
			},
			Property: {
				Property: {
					create: vi.fn(),
					update: vi.fn(),
					requestDelete: vi.fn(),
					queryById: vi.fn(),
					queryByCommunityId: vi.fn(),
					queryOwnerOptionsByCommunityId: vi.fn(),
				},
			},
			verifiedUser: {
				verifiedJwt: { sub: 'user-sub-1' },
				hints: {
					communityId: 'community-1',
				},
			},
		},
	} as unknown as GraphContext;
}

function setVerifiedUser(context: GraphContext, verifiedUser: unknown): void {
	(context.applicationServices as unknown as { verifiedUser?: unknown }).verifiedUser = verifiedUser;
}

const info = {} as GraphQLResolveInfo;

describe('property.resolvers - unit tests', () => {
	describe('Property.owner', () => {
		it('returns null when the property has no owner', async () => {
			const context = createContext();
			const resolver = propertyResolvers.Property?.owner as ResolverFn;
			await expect(resolver({ id: 'property-1', owner: null }, {}, context, info)).resolves.toBeNull();
			expect(context.applicationServices.Community.Member.queryByIdsWithRole).not.toHaveBeenCalled();
		});

		it('batches concurrent owner lookups from one request into a single readonly member query', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Community.Member.queryByIdsWithRole).mockResolvedValue([
				{ id: 'member-7', memberName: 'Owner Seven', accounts: [] },
				{ id: 'member-8', memberName: 'Owner Eight', accounts: [] },
			] as never);
			const resolver = propertyResolvers.Property?.owner as ResolverFn;
			const [first, second, repeat] = await Promise.all([
				resolver({ id: 'property-1', owner: { id: 'member-7' } }, {}, context, info),
				resolver({ id: 'property-2', owner: { id: 'member-8' } }, {}, context, info),
				resolver({ id: 'property-3', owner: { id: 'member-7' } }, {}, context, info),
			]);
			expect(first).toMatchObject({ id: 'member-7', memberName: 'Owner Seven' });
			expect(second).toMatchObject({ id: 'member-8', memberName: 'Owner Eight' });
			expect(repeat).toMatchObject({ id: 'member-7', memberName: 'Owner Seven' });
			// One batched query for the whole list, not one query per property
			expect(context.applicationServices.Community.Member.queryByIdsWithRole).toHaveBeenCalledTimes(1);
			expect(context.applicationServices.Community.Member.queryByIdsWithRole).toHaveBeenCalledWith({ ids: ['member-7', 'member-8'] });
			// The transactional unit-of-work path must not be used for read-only owner resolution.
			expect(context.applicationServices.Community.Member.queryById).not.toHaveBeenCalled();
		});

		it('returns null for owners that no longer exist', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Community.Member.queryByIdsWithRole).mockResolvedValue([] as never);
			const resolver = propertyResolvers.Property?.owner as ResolverFn;
			await expect(resolver({ id: 'property-1', owner: { id: 'member-gone' } }, {}, context, info)).resolves.toBeNull();
		});

		it('does not share owner batches or cached members across requests', async () => {
			const contextA = createContext();
			const contextB = createContext();
			vi.mocked(contextA.applicationServices.Community.Member.queryByIdsWithRole).mockResolvedValue([{ id: 'member-7', memberName: 'From Request A', accounts: [] }] as never);
			vi.mocked(contextB.applicationServices.Community.Member.queryByIdsWithRole).mockResolvedValue([{ id: 'member-7', memberName: 'From Request B', accounts: [] }] as never);
			const resolver = propertyResolvers.Property?.owner as ResolverFn;
			await expect(resolver({ id: 'property-1', owner: { id: 'member-7' } }, {}, contextA, info)).resolves.toMatchObject({ memberName: 'From Request A' });
			await expect(resolver({ id: 'property-1', owner: { id: 'member-7' } }, {}, contextB, info)).resolves.toMatchObject({ memberName: 'From Request B' });
			expect(contextA.applicationServices.Community.Member.queryByIdsWithRole).toHaveBeenCalledTimes(1);
			expect(contextB.applicationServices.Community.Member.queryByIdsWithRole).toHaveBeenCalledTimes(1);
		});
	});

	describe('Query.property', () => {
		it('throws Unauthorized when there is no verified user', async () => {
			const context = createContext();
			setVerifiedUser(context, undefined);
			const resolver = propertyResolvers.Query?.property as ResolverFn;
			await expect(resolver(null, { id: 'property-1' }, context, info)).rejects.toThrow('Unauthorized');
		});

		it('returns the property from queryById', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.queryById).mockResolvedValue({ id: 'property-1', community: { id: 'community-1' } } as never);
			const resolver = propertyResolvers.Query?.property as ResolverFn;
			await expect(resolver(null, { id: 'property-1' }, context, info)).resolves.toMatchObject({ id: 'property-1' });
			expect(context.applicationServices.Property.Property.queryById).toHaveBeenCalledWith({ id: 'property-1' });
		});

		it('returns null for a missing or soft-deleted property', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.queryById).mockResolvedValue(null as never);
			const resolver = propertyResolvers.Query?.property as ResolverFn;
			await expect(resolver(null, { id: 'missing' }, context, info)).resolves.toBeNull();
		});

		it('propagates Unauthorized thrown by the application service visa guard', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.queryById).mockRejectedValue(new Error('Unauthorized'));
			const resolver = propertyResolvers.Query?.property as ResolverFn;
			await expect(resolver(null, { id: 'property-1' }, context, info)).rejects.toThrow('Unauthorized');
		});
	});

	describe('Query.propertiesByCommunityId', () => {
		it('throws Unauthorized when there is no verified user', async () => {
			const context = createContext();
			setVerifiedUser(context, undefined);
			const resolver = propertyResolvers.Query?.propertiesByCommunityId as ResolverFn;
			await expect(resolver(null, { communityId: 'community-1' }, context, info)).rejects.toThrow('Unauthorized');
		});

		it('returns the properties for the community', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.queryByCommunityId).mockResolvedValue([{ id: 'property-1' }] as never);
			const resolver = propertyResolvers.Query?.propertiesByCommunityId as ResolverFn;
			await expect(resolver(null, { communityId: 'community-1' }, context, info)).resolves.toEqual([{ id: 'property-1' }]);
			expect(context.applicationServices.Property.Property.queryByCommunityId).toHaveBeenCalledWith({ communityId: 'community-1' });
		});

		it('propagates Unauthorized thrown by the application service visa guard', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.queryByCommunityId).mockRejectedValue(new Error('Unauthorized'));
			const resolver = propertyResolvers.Query?.propertiesByCommunityId as ResolverFn;
			await expect(resolver(null, { communityId: 'community-1' }, context, info)).rejects.toThrow('Unauthorized');
		});
	});

	describe('Query.propertyOwnerOptions', () => {
		it('throws Unauthorized when there is no verified user', async () => {
			const context = createContext();
			setVerifiedUser(context, undefined);
			const resolver = propertyResolvers.Query?.propertyOwnerOptions as ResolverFn;
			await expect(resolver(null, { communityId: 'community-1' }, context, info)).rejects.toThrow('Unauthorized');
			expect(context.applicationServices.Property.Property.queryOwnerOptionsByCommunityId).not.toHaveBeenCalled();
		});

		it('returns the owner options resolved by the property-authorized application service', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.queryOwnerOptionsByCommunityId).mockResolvedValue([{ id: 'member-1', memberName: 'Alice Anderson' }] as never);
			const resolver = propertyResolvers.Query?.propertyOwnerOptions as ResolverFn;
			await expect(resolver(null, { communityId: 'community-1' }, context, info)).resolves.toEqual([{ id: 'member-1', memberName: 'Alice Anderson' }]);
			expect(context.applicationServices.Property.Property.queryOwnerOptionsByCommunityId).toHaveBeenCalledWith({ communityId: 'community-1' });
		});

		it('propagates Unauthorized thrown by the application service visa guard', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.queryOwnerOptionsByCommunityId).mockRejectedValue(new Error('Unauthorized'));
			const resolver = propertyResolvers.Query?.propertyOwnerOptions as ResolverFn;
			await expect(resolver(null, { communityId: 'community-1' }, context, info)).rejects.toThrow('Unauthorized');
		});
	});

	describe('Mutation.propertyCreate', () => {
		it('returns failure status when there is no verified user', async () => {
			const context = createContext();
			setVerifiedUser(context, undefined);
			const resolver = propertyResolvers.Mutation?.propertyCreate as ResolverFn;
			await expect(resolver(null, { input: { propertyName: 'P1' } }, context, info)).resolves.toMatchObject({
				status: { success: false, errorMessage: 'Unauthorized' },
			});
		});

		it('returns failure status when there is no current community hint', async () => {
			const context = createContext();
			setVerifiedUser(context, { verifiedJwt: { sub: 'user-sub-1' }, hints: { communityId: '' } });
			const resolver = propertyResolvers.Mutation?.propertyCreate as ResolverFn;
			await expect(resolver(null, { input: { propertyName: 'P1' } }, context, info)).resolves.toMatchObject({
				status: { success: false, errorMessage: 'No current community found' },
			});
		});

		it('creates the property in the current community and returns the committed property without a post-commit re-query', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.create).mockResolvedValue({ id: 'property-1', propertyName: 'P1' } as never);
			// A failing read model must not turn a committed write into a reported
			// failure (the UI would retry and hit the duplicate-name error).
			vi.mocked(context.applicationServices.Property.Property.queryById).mockRejectedValue(new Error('read model unavailable'));
			const resolver = propertyResolvers.Mutation?.propertyCreate as ResolverFn;
			await expect(resolver(null, { input: { propertyName: 'P1' } }, context, info)).resolves.toMatchObject({
				status: { success: true },
				property: { id: 'property-1', propertyName: 'P1' },
			});
			expect(context.applicationServices.Property.Property.create).toHaveBeenCalledWith({ propertyName: 'P1', communityId: 'community-1' });
			expect(context.applicationServices.Property.Property.queryById).not.toHaveBeenCalled();
		});

		it('forwards the full shared field set on create, preserving null-clear semantics', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.create).mockResolvedValue({ id: 'property-1' } as never);
			const resolver = propertyResolvers.Mutation?.propertyCreate as ResolverFn;

			await resolver(
				null,
				{
					input: {
						propertyName: 'Grand Pavilion',
						propertyType: 'house',
						ownerId: 'member-1',
						listedForSale: true,
						listedInDirectory: true,
						tags: ['waterfront', 'pool'],
						location: { address: { streetNumber: '42', streetName: 'Shoreline Dr', municipality: 'Half Moon Bay', countrySubdivision: 'CA', postalCode: '94019', country: 'USA' } },
						listingDetail: {
							price: 1250000,
							bathrooms: 3.5,
							amenities: ['Pool', 'Sauna'],
							images: ['https://cdn.example.com/img1.jpg'],
							bedroomDetails: [{ roomName: 'Primary Suite', bedDescriptions: ['King', 'Crib'] }],
							additionalAmenities: [{ category: 'Outdoor', amenities: ['Fire Pit'] }],
							listingAgent: 'Jane Realtor',
						},
					},
				},
				context,
				info,
			);

			expect(context.applicationServices.Property.Property.create).toHaveBeenCalledWith({
				propertyName: 'Grand Pavilion',
				communityId: 'community-1',
				propertyType: 'house',
				ownerId: 'member-1',
				listedForSale: true,
				listedInDirectory: true,
				tags: ['waterfront', 'pool'],
				location: { address: { streetNumber: '42', streetName: 'Shoreline Dr', municipality: 'Half Moon Bay', countrySubdivision: 'CA', postalCode: '94019', country: 'USA' } },
				listingDetail: {
					price: 1250000,
					bathrooms: 3.5,
					amenities: ['Pool', 'Sauna'],
					images: ['https://cdn.example.com/img1.jpg'],
					bedroomDetails: [{ roomName: 'Primary Suite', bedDescriptions: ['King', 'Crib'] }],
					additionalAmenities: [{ category: 'Outdoor', amenities: ['Fire Pit'] }],
					listingAgent: 'Jane Realtor',
				},
			});
		});

		it('returns failure status with the error message when create fails', async () => {
			const context = createContext();
			const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {
				// suppress expected error logging
			});
			vi.mocked(context.applicationServices.Property.Property.create).mockRejectedValue(new Error('Too short'));
			const resolver = propertyResolvers.Mutation?.propertyCreate as ResolverFn;
			await expect(resolver(null, { input: { propertyName: '' } }, context, info)).resolves.toMatchObject({
				status: { success: false, errorMessage: 'Too short' },
			});
			consoleErr.mockRestore();
		});

		it('maps a raw duplicate-key (E11000) error to the friendly duplicate-name message', async () => {
			const context = createContext();
			const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {
				// suppress expected error logging
			});
			vi.mocked(context.applicationServices.Property.Property.create).mockRejectedValue(
				new Error('E11000 duplicate key error collection: ocom.properties index: community_1_propertyName_1 dup key: { community: ObjectId("c1"), propertyName: "Dune Cottage" }'),
			);
			const resolver = propertyResolvers.Mutation?.propertyCreate as ResolverFn;
			await expect(resolver(null, { input: { propertyName: 'Dune Cottage' } }, context, info)).resolves.toMatchObject({
				status: { success: false, errorMessage: 'A property with this name already exists' },
			});
			consoleErr.mockRestore();
		});
	});

	describe('Mutation.propertyUpdate', () => {
		it('returns failure status when there is no verified user', async () => {
			const context = createContext();
			setVerifiedUser(context, undefined);
			const resolver = propertyResolvers.Mutation?.propertyUpdate as ResolverFn;
			await expect(resolver(null, { input: { id: 'property-1' } }, context, info)).resolves.toMatchObject({
				status: { success: false, errorMessage: 'Unauthorized' },
			});
		});

		it('returns the committed property without a post-commit re-query', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.update).mockResolvedValue({ id: 'property-1', propertyName: 'Renamed Manor' } as never);
			// A failing read model must not turn a committed write into a reported
			// failure (the UI would retry an update that already applied).
			vi.mocked(context.applicationServices.Property.Property.queryById).mockRejectedValue(new Error('read model unavailable'));
			const resolver = propertyResolvers.Mutation?.propertyUpdate as ResolverFn;
			await expect(resolver(null, { input: { id: 'property-1', propertyName: 'Renamed Manor' } }, context, info)).resolves.toMatchObject({
				status: { success: true },
				property: { id: 'property-1', propertyName: 'Renamed Manor' },
			});
			expect(context.applicationServices.Property.Property.queryById).not.toHaveBeenCalled();
		});

		it('forwards provided fields, dropping null name but keeping type and numeric nulls as clears', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.update).mockResolvedValue({ id: 'property-1' } as never);
			const resolver = propertyResolvers.Mutation?.propertyUpdate as ResolverFn;

			await resolver(
				null,
				{
					input: {
						id: 'property-1',
						propertyName: null,
						propertyType: 'condo',
						listingDetail: { bedrooms: 3, bathrooms: null, squareFeet: undefined },
					},
				},
				context,
				info,
			);
			expect(context.applicationServices.Property.Property.update).toHaveBeenCalledWith({
				id: 'property-1',
				propertyType: 'condo',
				listingDetail: { bedrooms: 3, bathrooms: null },
			});
		});

		it('clears all numeric listing details when explicit nulls are provided', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.update).mockResolvedValue({ id: 'property-1' } as never);
			const resolver = propertyResolvers.Mutation?.propertyUpdate as ResolverFn;

			await resolver(null, { input: { id: 'property-1', listingDetail: { bedrooms: null, bathrooms: null, squareFeet: null } } }, context, info);
			expect(context.applicationServices.Property.Property.update).toHaveBeenCalledWith({
				id: 'property-1',
				listingDetail: { bedrooms: null, bathrooms: null, squareFeet: null },
			});
		});

		it('omits listingDetail entirely when it is null', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.update).mockResolvedValue({ id: 'property-1' } as never);
			const resolver = propertyResolvers.Mutation?.propertyUpdate as ResolverFn;

			await resolver(null, { input: { id: 'property-1', propertyName: 'New Name', propertyType: null, listingDetail: null } }, context, info);
			expect(context.applicationServices.Property.Property.update).toHaveBeenCalledWith({
				id: 'property-1',
				propertyName: 'New Name',
				propertyType: null,
			});
		});

		it('forwards an explicit null propertyType so the stored value is cleared', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.update).mockResolvedValue({ id: 'property-1' } as never);
			const resolver = propertyResolvers.Mutation?.propertyUpdate as ResolverFn;

			await resolver(null, { input: { id: 'property-1', propertyType: null } }, context, info);
			expect(context.applicationServices.Property.Property.update).toHaveBeenCalledWith({
				id: 'property-1',
				propertyType: null,
			});
		});

		it('forwards the owner id and an explicit null ownerId as a clear', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.update).mockResolvedValue({ id: 'property-1' } as never);
			const resolver = propertyResolvers.Mutation?.propertyUpdate as ResolverFn;

			await resolver(null, { input: { id: 'property-1', ownerId: 'member-1' } }, context, info);
			expect(context.applicationServices.Property.Property.update).toHaveBeenLastCalledWith({ id: 'property-1', ownerId: 'member-1' });

			await resolver(null, { input: { id: 'property-1', ownerId: null } }, context, info);
			expect(context.applicationServices.Property.Property.update).toHaveBeenLastCalledWith({ id: 'property-1', ownerId: null });
		});

		it('forwards listing flags, tags, and the address fields that were provided', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.update).mockResolvedValue({ id: 'property-1' } as never);
			const resolver = propertyResolvers.Mutation?.propertyUpdate as ResolverFn;

			await resolver(
				null,
				{
					input: {
						id: 'property-1',
						listedForSale: true,
						listedForRent: true,
						listedForLease: false,
						listedInDirectory: true,
						tags: ['orchard', 'barn'],
						location: { address: { streetNumber: '500', municipality: 'Sunnyvale' } },
					},
				},
				context,
				info,
			);
			expect(context.applicationServices.Property.Property.update).toHaveBeenCalledWith({
				id: 'property-1',
				listedForSale: true,
				listedForRent: true,
				listedForLease: false,
				listedInDirectory: true,
				tags: ['orchard', 'barn'],
				location: { address: { streetNumber: '500', municipality: 'Sunnyvale' } },
			});
		});

		it('treats tags: null as clearing the list, consistent with the other list fields', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.update).mockResolvedValue({ id: 'property-1' } as never);
			const resolver = propertyResolvers.Mutation?.propertyUpdate as ResolverFn;

			await resolver(null, { input: { id: 'property-1', tags: null } }, context, info);
			expect(context.applicationServices.Property.Property.update).toHaveBeenLastCalledWith({ id: 'property-1', tags: [] });
		});

		it('treats explicit null bedroomDetails and additionalAmenities as clearing every row', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.update).mockResolvedValue({ id: 'property-1' } as never);
			const resolver = propertyResolvers.Mutation?.propertyUpdate as ResolverFn;

			await resolver(null, { input: { id: 'property-1', listingDetail: { bedroomDetails: null, additionalAmenities: null } } }, context, info);
			expect(context.applicationServices.Property.Property.update).toHaveBeenLastCalledWith({
				id: 'property-1',
				listingDetail: { bedroomDetails: [], additionalAmenities: [] },
			});
		});

		it('leaves bedroomDetails and additionalAmenities untouched when omitted', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.update).mockResolvedValue({ id: 'property-1' } as never);
			const resolver = propertyResolvers.Mutation?.propertyUpdate as ResolverFn;

			await resolver(null, { input: { id: 'property-1', listingDetail: { description: 'unchanged rows' } } }, context, info);
			expect(context.applicationServices.Property.Property.update).toHaveBeenLastCalledWith({
				id: 'property-1',
				listingDetail: { description: 'unchanged rows' },
			});
		});

		it('forwards extended listing detail fields including wholesale row replacements', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.update).mockResolvedValue({ id: 'property-1' } as never);
			const resolver = propertyResolvers.Mutation?.propertyUpdate as ResolverFn;

			await resolver(
				null,
				{
					input: {
						id: 'property-1',
						listingDetail: {
							rentHigh: 3900,
							rentLow: 3200,
							lease: 3600,
							maxGuests: 6,
							yearBuilt: 1976,
							lotSize: null,
							description: 'Bright duplex near the marina',
							video: 'https://cdn.example.com/tour.mp4',
							floorPlan: null,
							floorPlanImages: ['https://cdn.example.com/floor1.png'],
							listingAgentPhone: '555-0142',
							listingAgentCompanyWebsite: 'https://realty.example',
							bedroomDetails: [{ roomName: 'Primary Suite', bedDescriptions: ['King'] }],
							additionalAmenities: [{ category: 'Outdoor', amenities: ['BBQ'] }],
						},
					},
				},
				context,
				info,
			);
			expect(context.applicationServices.Property.Property.update).toHaveBeenCalledWith({
				id: 'property-1',
				listingDetail: {
					rentHigh: 3900,
					rentLow: 3200,
					lease: 3600,
					maxGuests: 6,
					yearBuilt: 1976,
					lotSize: null,
					description: 'Bright duplex near the marina',
					video: 'https://cdn.example.com/tour.mp4',
					floorPlan: null,
					floorPlanImages: ['https://cdn.example.com/floor1.png'],
					listingAgentPhone: '555-0142',
					listingAgentCompanyWebsite: 'https://realty.example',
					bedroomDetails: [{ roomName: 'Primary Suite', bedDescriptions: ['King'] }],
					additionalAmenities: [{ category: 'Outdoor', amenities: ['BBQ'] }],
				},
			});
		});

		it('returns failure status with the error message when update fails', async () => {
			const context = createContext();
			const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {
				// suppress expected error logging
			});
			vi.mocked(context.applicationServices.Property.Property.update).mockRejectedValue(new Error('You do not have permission to update this property'));
			const resolver = propertyResolvers.Mutation?.propertyUpdate as ResolverFn;
			await expect(resolver(null, { input: { id: 'property-1' } }, context, info)).resolves.toMatchObject({
				status: { success: false, errorMessage: 'You do not have permission to update this property' },
			});
			consoleErr.mockRestore();
		});

		it('maps a duplicate-key error detected via the numeric code to the friendly duplicate-name message', async () => {
			const context = createContext();
			const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {
				// suppress expected error logging
			});
			// MongoServerError carries code 11000 even when the message shape varies.
			vi.mocked(context.applicationServices.Property.Property.update).mockRejectedValue(Object.assign(new Error('duplicate key error'), { code: 11000 }));
			const resolver = propertyResolvers.Mutation?.propertyUpdate as ResolverFn;
			await expect(resolver(null, { input: { id: 'property-1', propertyName: 'Anchor Cottage' } }, context, info)).resolves.toMatchObject({
				status: { success: false, errorMessage: 'A property with this name already exists' },
			});
			consoleErr.mockRestore();
		});
	});

	describe('Mutation.propertyDelete', () => {
		it('returns failure status when there is no verified user', async () => {
			const context = createContext();
			setVerifiedUser(context, undefined);
			const resolver = propertyResolvers.Mutation?.propertyDelete as ResolverFn;
			await expect(resolver(null, { input: { id: 'property-1' } }, context, info)).resolves.toMatchObject({
				status: { success: false, errorMessage: 'Unauthorized' },
			});
		});

		it('requests deletion and returns success without a property', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.requestDelete).mockResolvedValue({ id: 'property-1' } as never);
			const resolver = propertyResolvers.Mutation?.propertyDelete as ResolverFn;
			await expect(resolver(null, { input: { id: 'property-1' } }, context, info)).resolves.toMatchObject({
				status: { success: true },
				property: null,
			});
			expect(context.applicationServices.Property.Property.requestDelete).toHaveBeenCalledWith({ id: 'property-1' });
		});

		it('returns failure status with the error message when delete fails', async () => {
			const context = createContext();
			const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {
				// suppress expected error logging
			});
			vi.mocked(context.applicationServices.Property.Property.requestDelete).mockRejectedValue(new Error('You do not have permission to delete this property'));
			const resolver = propertyResolvers.Mutation?.propertyDelete as ResolverFn;
			await expect(resolver(null, { input: { id: 'property-1' } }, context, info)).resolves.toMatchObject({
				status: { success: false, errorMessage: 'You do not have permission to delete this property' },
			});
			consoleErr.mockRestore();
		});
	});
});
