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
		let shouldCharge = false;
		let communityToReturn: Domain.Contexts.Community.Community.CommunityEntityReference | undefined;

		await dataSources.domainDataSource.Community.Community.CommunityUnitOfWork.withTransaction(passport, async (repo) => {
			const community = await repo.get(command.communityId);
			if (!community) {
				throw new Error(`Community not found for id ${command.communityId}`);
			}

			const existingInstrumentId = community.finance.paymentInstrumentId;
			const hasSuccessfulCharge = financeOf(community).transactions.some((transaction) => transaction.transactionReference.isSuccess === true);
			shouldCharge = !existingInstrumentId && !hasSuccessfulCharge;

			const instrument = existingInstrumentId ? await paymentService.updatePaymentInstrument(existingInstrumentId, command.paymentInstrument) : await paymentService.createPaymentInstrument(command.paymentInstrument);

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
