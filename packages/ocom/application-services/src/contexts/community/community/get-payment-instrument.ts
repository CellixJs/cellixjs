import type { DataSources } from '@ocom/persistence';
import type { PaymentInstrumentDisplay, PaymentOperations } from '@ocom/service-payment';
import { type CommunityQueryCanManageBillingCommand, queryCanManageBilling } from './query-can-manage-billing.ts';

export interface CommunityGetPaymentInstrumentCommand {
	communityId: string;
	endUserExternalId: string | undefined;
}

export const getPaymentInstrument = (dataSources: DataSources, paymentService: PaymentOperations, canManageBilling: (command: CommunityQueryCanManageBillingCommand) => Promise<boolean> = queryCanManageBilling(dataSources)) => {
	return async (command: CommunityGetPaymentInstrumentCommand): Promise<PaymentInstrumentDisplay | null> => {
		if (!(await canManageBilling({ communityId: command.communityId, endUserExternalId: command.endUserExternalId }))) {
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
