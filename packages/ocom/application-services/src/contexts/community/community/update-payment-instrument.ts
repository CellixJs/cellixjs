import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type { PaymentInstrumentInput, PaymentOperations } from '@ocom/service-payment';
import { financeOf } from './community-finance-view.ts';
import { processSubscriptionCharge } from './process-subscription-charge.ts';
import { resolveCommunityBillingPassport } from './resolve-community-actor.ts';

export interface CommunityUpdatePaymentInstrumentCommand {
	communityId: string;
	paymentInstrument: PaymentInstrumentInput;
	endUserExternalId: string;
}

export const updatePaymentInstrument = (dataSources: DataSources, paymentService: PaymentOperations) => {
	return async (command: CommunityUpdatePaymentInstrumentCommand): Promise<Domain.Contexts.Community.Community.CommunityEntityReference> => {
		const token = command.paymentInstrument.paymentToken?.trim() ?? '';
		if (!token) {
			throw new Error('A payment instrument token is required');
		}

		const passport = await resolveCommunityBillingPassport(dataSources, command.communityId, command.endUserExternalId);

		const existing = await dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getById(command.communityId);
		if (!existing) {
			throw new Error(`Community not found for id ${command.communityId}`);
		}
		const existingFinance = financeOf(existing);
		const existingInstrumentId = existingFinance.paymentInstrumentId;
		const hasSuccessfulCharge = existingFinance.transactions.some((transaction) => transaction.transactionReference.isSuccess === true);
		const shouldCharge = !existingInstrumentId && !hasSuccessfulCharge;

		// Vaulting happens before the transaction opens: holding a Mongo transaction
		// across gateway I/O risks aborting after the card was vaulted, which would lose
		// the new instrument id while the gateway still holds the card.
		const instrument = existingInstrumentId ? await paymentService.updatePaymentInstrument(existingInstrumentId, command.paymentInstrument) : await paymentService.createPaymentInstrument(command.paymentInstrument);

		let communityToReturn: Domain.Contexts.Community.Community.CommunityEntityReference | undefined;
		await dataSources.domainDataSource.Community.Community.CommunityUnitOfWork.withTransaction(passport, async (repo) => {
			const community = await repo.get(command.communityId);
			if (!community) {
				throw new Error(`Community not found for id ${command.communityId}`);
			}
			community.finance.paymentInstrumentId = instrument.id;
			communityToReturn = await repo.save(community);
		});

		if (!communityToReturn) {
			throw new Error('community not found');
		}

		if (shouldCharge) {
			return await processSubscriptionCharge(
				dataSources,
				paymentService,
			)({
				communityId: command.communityId,
				endUserExternalId: command.endUserExternalId,
			});
		}

		return communityToReturn;
	};
};
