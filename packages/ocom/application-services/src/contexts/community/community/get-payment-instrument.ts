import type { DataSources } from '@ocom/persistence';
import type { PaymentInstrumentDisplay, PaymentOperations } from '@ocom/service-payment';
import { actorCanManageCommunityBilling } from './resolve-community-actor.ts';

export interface CommunityGetPaymentInstrumentCommand {
	communityId: string;
	endUserExternalId: string | undefined;
}

export const getPaymentInstrument = (dataSources: DataSources, paymentService: PaymentOperations) => {
	return async (command: CommunityGetPaymentInstrumentCommand): Promise<PaymentInstrumentDisplay | null> => {
		if (!(await actorCanManageCommunityBilling(dataSources, command.communityId, command.endUserExternalId))) {
			return null;
		}
		const community = await dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getById(command.communityId);
		const paymentInstrumentId = community?.finance.paymentInstrumentId;
		if (!paymentInstrumentId) {
			return null;
		}
		return await paymentService.getPaymentInstrument(paymentInstrumentId);
	};
};
