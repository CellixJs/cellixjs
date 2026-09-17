import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type { PaymentInstrumentInput, PaymentOperations } from '@ocom/service-payment';
import { financeOf } from './community-finance-view.ts';
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
		// Saving a card deliberately does not charge. Charging here billed at whatever tier
		// was applied earlier in the same submit, which contradicts "changing the plan does
		// not charge"; the admin raises a charge explicitly instead.
		const existingInstrumentId = financeOf(existing).paymentInstrumentId;

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

		return communityToReturn;
	};
};
