import type { PropertyUpdateCommand, PropertyUpdateListingDetailCommand } from '@ocom/application-services';
import type { Domain } from '@ocom/domain';
import type { GraphQLResolveInfo } from 'graphql';
import type { PropertyCreateInput, PropertyDeleteInput, PropertyUpdateInput, Resolvers } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';

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
 * Admin-side property reads require the manage-properties permission in the
 * target community (spec: backend queries enforce canManageProperties), not
 * mere membership.
 */
const ensureActorCanManagePropertiesInCommunity = async (context: GraphContext, communityId: string | null | undefined): Promise<void> => {
	const externalId = context.applicationServices.verifiedUser?.verifiedJwt?.sub;
	if (!externalId || !communityId) {
		throw new Error('Unauthorized');
	}
	let canManageProperties = false;
	try {
		const members = await context.applicationServices.Community.Member.queryByEndUserExternalId({ externalId });
		const memberInCommunity = members.find((member) => String(member.communityId) === String(communityId));
		if (memberInCommunity) {
			const memberWithRole = await context.applicationServices.Community.Member.queryByIdWithRole({ id: memberInCommunity.id });
			canManageProperties = memberWithRole?.role?.permissions?.propertyPermissions?.canManageProperties === true;
		}
	} catch (error) {
		console.error('Property > Query > authorization lookup failed : ', error);
		throw new Error('Unauthorized');
	}
	if (!canManageProperties) {
		throw new Error('Unauthorized');
	}
};

const property: Resolvers = {
	Property: {
		owner: async (parent, _args, context: GraphContext) => {
			const ownerRef = parent.owner as { id?: string } | string | null | undefined;
			const ownerId = typeof ownerRef === 'string' ? ownerRef : ownerRef?.id;
			if (!ownerId) {
				return null;
			}
			// Resolve through the member read model: the domain adapter's owner exposes
			// a non-iterable accounts collection that GraphQL cannot serialize.
			return await context.applicationServices.Community.Member.queryById({ id: ownerId });
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
			await ensureActorCanManagePropertiesInCommunity(context, foundProperty.community?.id);
			return foundProperty;
		},
		propertiesByCommunityId: async (_parent, args: { communityId: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			await ensureActorCanManagePropertiesInCommunity(context, args.communityId);
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
			if (args.input.propertyType !== null && args.input.propertyType !== undefined) {
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
