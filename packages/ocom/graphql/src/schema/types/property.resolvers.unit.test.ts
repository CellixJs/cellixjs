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
					queryByEndUserExternalId: vi.fn().mockResolvedValue([{ id: 'member-1', communityId: 'community-1' }]),
					queryById: vi.fn(),
				},
			},
			Property: {
				Property: {
					create: vi.fn(),
					update: vi.fn(),
					requestDelete: vi.fn(),
					queryById: vi.fn(),
					queryByCommunityId: vi.fn(),
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
			expect(context.applicationServices.Community.Member.queryById).not.toHaveBeenCalled();
		});

		it('resolves the owner through the member read model so nested fields are GraphQL-safe', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Community.Member.queryById).mockResolvedValue({ id: 'member-7', memberName: 'Owner Member', accounts: [] } as never);
			const resolver = propertyResolvers.Property?.owner as ResolverFn;
			await expect(resolver({ id: 'property-1', owner: { id: 'member-7' } }, {}, context, info)).resolves.toMatchObject({ id: 'member-7', memberName: 'Owner Member' });
			expect(context.applicationServices.Community.Member.queryById).toHaveBeenCalledWith({ id: 'member-7' });
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

		it('throws Unauthorized when the actor is not a member of the property community', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Community.Member.queryByEndUserExternalId).mockResolvedValue([{ id: 'member-9', communityId: 'community-9' }] as never);
			vi.mocked(context.applicationServices.Property.Property.queryById).mockResolvedValue({ id: 'property-1', community: { id: 'community-1' } } as never);
			const resolver = propertyResolvers.Query?.property as ResolverFn;
			await expect(resolver(null, { id: 'property-1' }, context, info)).rejects.toThrow('Unauthorized');
		});

		it('throws Unauthorized when the actor has no member records at all', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Community.Member.queryByEndUserExternalId).mockResolvedValue([] as never);
			vi.mocked(context.applicationServices.Property.Property.queryById).mockResolvedValue({ id: 'property-1', community: { id: 'community-1' } } as never);
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

		it('throws Unauthorized when the actor is not a member of the requested community', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Community.Member.queryByEndUserExternalId).mockResolvedValue([{ id: 'member-9', communityId: 'community-9' }] as never);
			const resolver = propertyResolvers.Query?.propertiesByCommunityId as ResolverFn;
			await expect(resolver(null, { communityId: 'community-1' }, context, info)).rejects.toThrow('Unauthorized');
			expect(context.applicationServices.Property.Property.queryByCommunityId).not.toHaveBeenCalled();
		});

		it('throws Unauthorized when membership lookup fails', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Community.Member.queryByEndUserExternalId).mockRejectedValue(new Error('boom'));
			const resolver = propertyResolvers.Query?.propertiesByCommunityId as ResolverFn;
			await expect(resolver(null, { communityId: 'community-1' }, context, info)).rejects.toThrow('Unauthorized');
			expect(context.applicationServices.Property.Property.queryByCommunityId).not.toHaveBeenCalled();
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

		it('creates the property in the current community and returns the persisted property', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.create).mockResolvedValue({ id: 'property-1' } as never);
			vi.mocked(context.applicationServices.Property.Property.queryById).mockResolvedValue({ id: 'property-1', propertyName: 'P1' } as never);
			const resolver = propertyResolvers.Mutation?.propertyCreate as ResolverFn;
			await expect(resolver(null, { input: { propertyName: 'P1' } }, context, info)).resolves.toMatchObject({
				status: { success: true },
				property: { id: 'property-1', propertyName: 'P1' },
			});
			expect(context.applicationServices.Property.Property.create).toHaveBeenCalledWith({ propertyName: 'P1', communityId: 'community-1' });
			expect(context.applicationServices.Property.Property.queryById).toHaveBeenCalledWith({ id: 'property-1' });
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

		it('forwards provided fields, dropping nulls for name and type but keeping numeric nulls as clears', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.update).mockResolvedValue({ id: 'property-1' } as never);
			vi.mocked(context.applicationServices.Property.Property.queryById).mockResolvedValue({ id: 'property-1' } as never);
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
			vi.mocked(context.applicationServices.Property.Property.queryById).mockResolvedValue({ id: 'property-1' } as never);
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
			vi.mocked(context.applicationServices.Property.Property.queryById).mockResolvedValue({ id: 'property-1' } as never);
			const resolver = propertyResolvers.Mutation?.propertyUpdate as ResolverFn;

			await resolver(null, { input: { id: 'property-1', propertyName: 'New Name', propertyType: null, listingDetail: null } }, context, info);
			expect(context.applicationServices.Property.Property.update).toHaveBeenCalledWith({
				id: 'property-1',
				propertyName: 'New Name',
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
