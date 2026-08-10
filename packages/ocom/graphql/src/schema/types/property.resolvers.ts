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

const property: Resolvers = {
	Query: {
		property: async (_parent, args: { id: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			return await context.applicationServices.Property.Property.queryById({
				id: args.id,
			});
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
			if (args.input.propertyType !== null && args.input.propertyType !== undefined) {
				updateCommand.propertyType = args.input.propertyType;
			}
			if (args.input.listingDetail !== null && args.input.listingDetail !== undefined) {
				const listingDetailCommand: PropertyUpdateListingDetailCommand = {};
				if (args.input.listingDetail.bedrooms !== null && args.input.listingDetail.bedrooms !== undefined) {
					listingDetailCommand.bedrooms = args.input.listingDetail.bedrooms;
				}
				if (args.input.listingDetail.bathrooms !== null && args.input.listingDetail.bathrooms !== undefined) {
					listingDetailCommand.bathrooms = args.input.listingDetail.bathrooms;
				}
				if (args.input.listingDetail.squareFeet !== null && args.input.listingDetail.squareFeet !== undefined) {
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
