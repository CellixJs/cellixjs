import type { GraphQLResolveInfo } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import type { GraphContext } from '../context.ts';
import propertyResolvers from './property.resolvers.ts';

type ResolverFn = (parent: unknown, args: unknown, context: GraphContext, info: GraphQLResolveInfo) => Promise<unknown>;

function createContext(): GraphContext {
	return {
		applicationServices: {
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
	describe('Query.property', () => {
		it('throws Unauthorized when there is no verified user', async () => {
			const context = createContext();
			setVerifiedUser(context, undefined);
			const resolver = propertyResolvers.Query?.property as ResolverFn;
			await expect(resolver(null, { id: 'property-1' }, context, info)).rejects.toThrow('Unauthorized');
		});

		it('returns the property from queryById', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.queryById).mockResolvedValue({ id: 'property-1' } as never);
			const resolver = propertyResolvers.Query?.property as ResolverFn;
			await expect(resolver(null, { id: 'property-1' }, context, info)).resolves.toEqual({ id: 'property-1' });
			expect(context.applicationServices.Property.Property.queryById).toHaveBeenCalledWith({ id: 'property-1' });
		});

		it('returns null for a missing or soft-deleted property', async () => {
			const context = createContext();
			vi.mocked(context.applicationServices.Property.Property.queryById).mockResolvedValue(null as never);
			const resolver = propertyResolvers.Query?.property as ResolverFn;
			await expect(resolver(null, { id: 'missing' }, context, info)).resolves.toBeNull();
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

		it('only forwards fields that are provided and non-null', async () => {
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
				listingDetail: { bedrooms: 3 },
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
