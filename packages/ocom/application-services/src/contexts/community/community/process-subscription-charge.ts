import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type { PaymentOperations } from '@ocom/service-payment';
import { financeOf } from './community-finance-view.ts';
import { resolveCommunityBillingPassport } from './resolve-community-actor.ts';

export interface CommunityProcessSubscriptionChargeCommand {
	communityId: string;
	endUserExternalId?: string | undefined;
	useSystemPassport?: boolean | undefined;
	/** Overrides the clock used to derive the billing period. Intended for tests. */
	chargedAt?: Date | undefined;
}

export const processSubscriptionCharge = (dataSources: DataSources, paymentService: PaymentOperations) => {
	return async (command: CommunityProcessSubscriptionChargeCommand): Promise<Domain.Contexts.Community.Community.CommunityEntityReference> => {
		const passport = command.useSystemPassport
			? Domain.PassportFactory.forSystem({
					canManageCommunitySettings: true,
					isSystemAccount: true,
				})
			: await resolveCommunityBillingPassport(dataSources, command.communityId, command.endUserExternalId ?? '');

		// Everything the charge needs is read up front so that no database transaction is
		// held open across external network I/O.
		const community = await dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getById(command.communityId);
		if (!community) {
			throw new Error(`Community not found for id ${command.communityId}`);
		}

		const finance = financeOf(community);
		const paymentInstrumentId = finance.paymentInstrumentId;
		if (!paymentInstrumentId) {
			throw new Error('A payment instrument is required to process a subscription charge');
		}

		const config = await dataSources.readonlyDataSource.Community.CommunityConfig.CommunityConfigReadRepo.getLatestEffective(finance.subscriptionTier);
		if (!config) {
			throw new Error(`No community config found for subscription tier ${finance.subscriptionTier}`);
		}

		const members = await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getByCommunityId(command.communityId);
		const amount = members.length * config.subscription.pricePerMember;

		// The reference is derived, not random, so that retrying a charge whose result was
		// never persisted reuses the same key and the gateway can deduplicate it. The
		// attempt index only advances once a charge has been recorded, so a deliberate
		// second charge in the same period still gets a distinct key.
		const billingPeriod = (command.chargedAt ?? new Date()).toISOString().slice(0, 7);
		const periodPrefix = `${command.communityId}:${billingPeriod}:`;
		const chargesRecordedThisPeriod = finance.transactions.filter((transaction) => transaction.transactionReference.referenceId?.startsWith(periodPrefix)).length;
		const referenceId = `${periodPrefix}${chargesRecordedThisPeriod}`;

		const paymentResult = await paymentService.processPayment({
			paymentInstrumentId,
			amount,
			currency: config.subscription.currency,
			referenceId,
		});

		// The money has already moved by this point, so the transaction below only records
		// the outcome — including failures, which must still be persisted.
		let communityToReturn: Domain.Contexts.Community.Community.CommunityEntityReference | undefined;
		await dataSources.domainDataSource.Community.Community.CommunityUnitOfWork.withTransaction(passport, async (repo) => {
			const communityToCharge = await repo.get(command.communityId);
			if (!communityToCharge) {
				throw new Error(`Community not found for id ${command.communityId}`);
			}

			const transaction = communityToCharge.requestNewTransaction();
			transaction.amount = amount;
			transaction.transactionReference = {
				vendor: paymentResult.vendor ?? null,
				isSuccess: paymentResult.isSuccess ?? false,
				lastRequestedAt: paymentResult.lastRequestedAt ?? null,
				referenceId: paymentResult.referenceId ?? referenceId,
				transactionId: paymentResult.transactionId ?? null,
				reconciliationId: paymentResult.reconciliationId ?? null,
				completedAt: paymentResult.completedAt ?? null,
				errorOccurredAt: paymentResult.errorOccurredAt ?? null,
				errorCode: paymentResult.errorCode ?? null,
				errorMessage: paymentResult.errorMessage ?? null,
			};

			communityToReturn = await repo.save(communityToCharge);
		});

		if (!communityToReturn) {
			throw new Error('community not found');
		}
		return communityToReturn;
	};
};
