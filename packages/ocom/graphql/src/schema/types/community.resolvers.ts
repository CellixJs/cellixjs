import type { CommunityUpdateSettingsCommand } from '@ocom/application-services';
import type { Domain } from '@ocom/domain';
import type { GraphQLResolveInfo } from 'graphql';
import type {
	CommunityCreateInput,
	CommunityProcessSubscriptionChargeInput,
	CommunityUpdatePaymentInstrumentInput,
	CommunityUpdateSettingsInput,
	CommunityUpdateSubscriptionTierInput,
	PaymentInstrumentInput,
	Resolvers,
} from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';

const CommunityMutationResolver = async (getCommunity: Promise<Domain.Contexts.Community.Community.CommunityEntityReference>) => {
	try {
		return {
			status: { success: true },
			community: await getCommunity,
		};
	} catch (error) {
		console.error('Community > Mutation  : ', error);
		const { message } = error as Error;
		return {
			status: { success: false, errorMessage: message },
		};
	}
};

const community: Resolvers = {
	Query: {
		currentCommunity: async (_parent, _args, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.hints?.communityId) {
				throw new Error('Unauthorized');
			}
			return await context.applicationServices.Community.Community.queryById({
				id: context.applicationServices.verifiedUser.hints.communityId,
			});
		},
		communityById: async (_parent, args: { id: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			return await context.applicationServices.Community.Community.queryById({
				id: args.id,
			});
		},
		communitiesForCurrentEndUser: async (_parent, _args, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}
			return await context.applicationServices.Community.Community.queryByEndUserExternalId({
				externalId: context.applicationServices.verifiedUser.verifiedJwt.sub,
			});
		},
		communitySubscription: async (_parent, args: { communityId: string }, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices?.verifiedUser?.verifiedJwt?.sub) {
				throw new Error('Unauthorized');
			}
			return await context.applicationServices.Community.Community.querySubscription({
				communityId: args.communityId,
				endUserExternalId: context.applicationServices.verifiedUser.verifiedJwt.sub,
			});
		},
	},
	Community: {
		// Billing fields are hidden from actors without canManageCommunitySettings, so a
		// member can still read the rest of the community they belong to.
		finance: async (parent, _args: unknown, context: GraphContext, _info: GraphQLResolveInfo) => {
			const canManageBilling = await context.applicationServices.Community.Community.queryCanManageBilling({
				communityId: parent.id,
				endUserExternalId: context.applicationServices.verifiedUser?.verifiedJwt?.sub,
			});
			// parent.finance is declared as props but is a CommunityFinance value object at
			// runtime, which is what CommunityFinanceEntityReference describes.
			return canManageBilling ? (parent.finance as unknown as Domain.Contexts.Community.Community.CommunityFinanceEntityReference) : null;
		},
		paymentInstrument: async (parent, _args: unknown, context: GraphContext, _info: GraphQLResolveInfo) => {
			return await context.applicationServices.Community.Community.getPaymentInstrument({
				communityId: parent.id,
				endUserExternalId: context.applicationServices.verifiedUser?.verifiedJwt?.sub,
			});
		},
	},
	Mutation: {
		communityCreate: async (_parent, args: { input: CommunityCreateInput }, context: GraphContext) => {
			if (!context.applicationServices?.verifiedUser?.verifiedJwt?.sub) {
				throw new Error('Unauthorized');
			}

			try {
				const created = await context.applicationServices.Community.Community.create({
					name: args.input.name,
					endUserExternalId: context.applicationServices.verifiedUser?.verifiedJwt.sub,
					...(args.input.subscriptionTier ? { subscriptionTier: args.input.subscriptionTier } : {}),
					...(args.input.paymentInstrument ? { paymentInstrument: toPaymentInstrumentInput(args.input.paymentInstrument) } : {}),
				});

				return { status: { success: true }, community: created };
			} catch (error) {
				console.error('Community > Mutation  : ', error);
				const { message } = error as Error;
				return {
					status: { success: false, errorMessage: message },
				};
			}
		},
		communityUpdateSettings: async (_parent, args: { input: CommunityUpdateSettingsInput }, context: GraphContext) => {
			if (!context.applicationServices?.verifiedUser?.verifiedJwt?.sub) {
				throw new Error('Unauthorized');
			}
			const updateCommand: CommunityUpdateSettingsCommand = {
				id: args.input.id,
			};
			if (args.input.name !== null && args.input.name !== undefined) {
				updateCommand.name = args.input.name;
			}
			if (args.input.domain !== null && args.input.domain !== undefined) {
				updateCommand.domain = args.input.domain;
			}
			if (args.input.whiteLabelDomain !== undefined) {
				updateCommand.whiteLabelDomain = args.input.whiteLabelDomain;
			}
			if (args.input.handle !== undefined) {
				updateCommand.handle = args.input.handle;
			}
			return await CommunityMutationResolver(context.applicationServices.Community.Community.updateSettings(updateCommand));
		},
		communityUpdateSubscriptionTier: async (_parent, args: { input: CommunityUpdateSubscriptionTierInput }, context: GraphContext) => {
			if (!context.applicationServices?.verifiedUser?.verifiedJwt?.sub) {
				throw new Error('Unauthorized');
			}
			return await CommunityMutationResolver(
				context.applicationServices.Community.Community.updateSubscriptionTier({
					communityId: args.input.communityId,
					subscriptionTier: args.input.subscriptionTier,
					endUserExternalId: context.applicationServices.verifiedUser.verifiedJwt.sub,
				}),
			);
		},
		communityUpdatePaymentInstrument: async (_parent, args: { input: CommunityUpdatePaymentInstrumentInput }, context: GraphContext) => {
			if (!context.applicationServices?.verifiedUser?.verifiedJwt?.sub) {
				throw new Error('Unauthorized');
			}
			return await CommunityMutationResolver(
				context.applicationServices.Community.Community.updatePaymentInstrument({
					communityId: args.input.communityId,
					paymentInstrument: toPaymentInstrumentInput(args.input.paymentInstrument),
					endUserExternalId: context.applicationServices.verifiedUser.verifiedJwt.sub,
				}),
			);
		},
		communityProcessSubscriptionCharge: async (_parent, args: { input: CommunityProcessSubscriptionChargeInput }, context: GraphContext) => {
			if (!context.applicationServices?.verifiedUser?.verifiedJwt?.sub) {
				throw new Error('Unauthorized');
			}
			return await CommunityMutationResolver(
				context.applicationServices.Community.Community.processSubscriptionCharge({
					communityId: args.input.communityId,
					endUserExternalId: context.applicationServices.verifiedUser.verifiedJwt.sub,
					...(args.input.idempotencyKey ? { idempotencyKey: args.input.idempotencyKey } : {}),
				}),
			);
		},
	},
};

function toPaymentInstrumentInput(input: PaymentInstrumentInput) {
	return {
		paymentToken: input.paymentToken ?? '',
		billingName: input.billingName ?? undefined,
		billingEmail: input.billingEmail ?? undefined,
		billingAddress: input.billingAddress ?? undefined,
		billingCity: input.billingCity ?? undefined,
		billingState: input.billingState ?? undefined,
		billingPostalCode: input.billingPostalCode ?? undefined,
		billingCountry: input.billingCountry ?? undefined,
	};
}

export default community;
