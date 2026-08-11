import type { ApplicationServices, PropertyUpdateCommand, PropertyUpdateListingDetailCommand } from '@ocom/application-services';
import type { Domain } from '@ocom/domain';
import DataLoader from 'dataloader';
import type { GraphQLResolveInfo } from 'graphql';
import type { PropertyCreateInput, PropertyDeleteInput, PropertyUpdateInput, Resolvers } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';

type MemberEntityReference = Domain.Contexts.Community.Member.MemberEntityReference;

/**
 * Per-request owner loaders, keyed by the request-scoped ApplicationServices
 * instance. Batching concurrent Property.owner resolutions into a single
 * readonly member query avoids the N+1 pattern on property lists, while the
 * WeakMap guarantees no batch or cached member ever crosses request (and
 * therefore passport) boundaries.
 */
const ownerLoaders = new WeakMap<ApplicationServices, DataLoader<string, MemberEntityReference | null>>();

const ownerLoaderFor = (context: GraphContext): DataLoader<string, MemberEntityReference | null> => {
	let loader = ownerLoaders.get(context.applicationServices);
	if (!loader) {
		loader = new DataLoader<string, MemberEntityReference | null>(async (ids) => {
			const members = await context.applicationServices.Community.Member.queryByIdsWithRole({ ids: [...ids] });
			const membersById = new Map(members.map((member) => [member.id, member]));
			return ids.map((id) => membersById.get(id) ?? null);
		});
		ownerLoaders.set(context.applicationServices, loader);
	}
	return loader;
};

const PropertyMutationResolver = async (getProperty: Promise<Domain.Contexts.Property.Property.PropertyEntityReference | null>) => {
	try {
		return {
			status: { success: true },
			property: await getProperty,
		};
	} catch (error) {
		console.error('Property > Mutation : ', error);
		const { message } = error as Error;
		return {
			status: { success: false, errorMessage: message },
		};
	}
};

/**
 * Admin-side property reads are authorized in the application services via the
 * request passport's property visa (built from the request's current
 * member/community hints), which requires `canManageProperties` in the
 * property's community. Resolvers only pre-check that a verified user exists.
 */
const property: Resolvers = {
	Property: {
		owner: async (parent, _args, context: GraphContext) => {
			const ownerRef = parent.owner as { id?: string } | string | null | undefined;
			const ownerId = typeof ownerRef === 'string' ? ownerRef : ownerRef?.id;
			if (!ownerId) {
				return null;
			}
			// Resolve through the readonly member read model: the domain adapter's owner
			// exposes a non-iterable accounts collection that GraphQL cannot serialize,
			// and the per-request loader batches all owner lookups of a property list
			// into one query without opening any transaction.
			return await ownerLoaderFor(context).load(ownerId);
		},
	},
	Query: {
		property: async (_parent, args: { id: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			const foundProperty = await context.applicationServices.Property.Property.queryById({
				id: args.id,
			});
			if (!foundProperty) {
				return null;
			}
			return foundProperty;
		},
		propertiesByCommunityId: async (_parent, args: { communityId: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			return await context.applicationServices.Property.Property.queryByCommunityId({
				communityId: args.communityId,
			});
		},
	},
	Mutation: {
		propertyCreate: async (_parent, args: { input: PropertyCreateInput }, context: GraphContext) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				return { status: { success: false, errorMessage: 'Unauthorized' } };
			}
			const communityId = context.applicationServices.verifiedUser?.hints?.communityId;
			if (!communityId) {
				return { status: { success: false, errorMessage: 'No current community found' } };
			}
			return await PropertyMutationResolver(
				context.applicationServices.Property.Property.create({
					propertyName: args.input.propertyName,
					communityId: communityId,
				}).then((created) => context.applicationServices.Property.Property.queryById({ id: created.id })),
			);
		},
		propertyUpdate: async (_parent, args: { input: PropertyUpdateInput }, context: GraphContext) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				return { status: { success: false, errorMessage: 'Unauthorized' } };
			}
			const updateCommand: PropertyUpdateCommand = {
				id: args.input.id,
			};
			if (args.input.propertyName !== null && args.input.propertyName !== undefined) {
				updateCommand.propertyName = args.input.propertyName;
			}
			// Explicit null propertyType is a deliberate clear and must be forwarded.
			if (args.input.propertyType !== undefined) {
				updateCommand.propertyType = args.input.propertyType;
			}
			if (args.input.listingDetail !== null && args.input.listingDetail !== undefined) {
				const listingDetailCommand: PropertyUpdateListingDetailCommand = {};
				// Numeric listing fields: explicit null is a deliberate clear and must be forwarded.
				if (args.input.listingDetail.bedrooms !== undefined) {
					listingDetailCommand.bedrooms = args.input.listingDetail.bedrooms;
				}
				if (args.input.listingDetail.bathrooms !== undefined) {
					listingDetailCommand.bathrooms = args.input.listingDetail.bathrooms;
				}
				if (args.input.listingDetail.squareFeet !== undefined) {
					listingDetailCommand.squareFeet = args.input.listingDetail.squareFeet;
				}
				updateCommand.listingDetail = listingDetailCommand;
			}
			return await PropertyMutationResolver(context.applicationServices.Property.Property.update(updateCommand).then((updated) => context.applicationServices.Property.Property.queryById({ id: updated.id })));
		},
		propertyDelete: async (_parent, args: { input: PropertyDeleteInput }, context: GraphContext) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				return { status: { success: false, errorMessage: 'Unauthorized' } };
			}
			return await PropertyMutationResolver(
				context.applicationServices.Property.Property.requestDelete({
					id: args.input.id,
				}).then(() => null),
			);
		},
	},
};

export default property;
