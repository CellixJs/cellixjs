import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type { PaymentOperations } from '@ocom/service-payment';
import { resolveCommunityBillingPassport } from './resolve-community-actor.ts';

export interface CommunityProcessSubscriptionChargeCommand {
	communityId: string;
	endUserExternalId?: string | undefined;
	useSystemPassport?: boolean | undefined;
}

export const processSubscriptionCharge = (dataSources: DataSources, paymentService: PaymentOperations) => {
	return async (command: CommunityProcessSubscriptionChargeCommand): Promise<Domain.Contexts.Community.Community.CommunityEntityReference> => {
		const passport = command.useSystemPassport
			? Domain.PassportFactory.forSystem({
					canManageCommunitySettings: true,
					isSystemAccount: true,
				})
			: await resolveCommunityBillingPassport(dataSources, command.communityId, command.endUserExternalId ?? '');

		let communityToReturn: Domain.Contexts.Community.Community.CommunityEntityReference | undefined;
		await dataSources.domainDataSource.Community.Community.CommunityUnitOfWork.withTransaction(passport, async (repo) => {
			const community = await repo.get(command.communityId);
			if (!community) {
				throw new Error(`Community not found for id ${command.communityId}`);
			}

			const paymentInstrumentId = community.finance.paymentInstrumentId;
			if (!paymentInstrumentId) {
				throw new Error('A payment instrument is required to process a subscription charge');
			}

			const members = await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getByCommunityId(command.communityId);
			const memberCount = members.length;
			const config = await dataSources.readonlyDataSource.Community.CommunityConfig.CommunityConfigReadRepo.getLatestEffective(community.finance.subscriptionTier);
			if (!config) {
				throw new Error(`No community config found for subscription tier ${community.finance.subscriptionTier}`);
			}

			const amount = memberCount * config.subscription.pricePerMember;
			const paymentResult = await paymentService.processPayment({
				paymentInstrumentId,
				amount,
				currency: config.subscription.currency,
				referenceId: command.communityId,
			});

			const transaction = community.requestNewTransaction();
			transaction.amount = amount;
			transaction.transactionReference = {
				vendor: paymentResult.vendor ?? null,
				isSuccess: paymentResult.isSuccess ?? false,
				lastRequestedAt: paymentResult.lastRequestedAt ?? null,
				referenceId: paymentResult.referenceId ?? null,
				transactionId: paymentResult.transactionId ?? null,
				reconciliationId: paymentResult.reconciliationId ?? null,
				completedAt: paymentResult.completedAt ?? null,
				errorOccurredAt: paymentResult.errorOccurredAt ?? null,
				errorCode: paymentResult.errorCode ?? null,
				errorMessage: paymentResult.errorMessage ?? null,
			};

			communityToReturn = await repo.save(community);
		});

		if (!communityToReturn) {
			throw new Error('community not found');
		}
		return communityToReturn;
	};
};
