import type { DataSources } from '@ocom/persistence';
import type { PaymentInstrumentDisplay, PaymentOperations } from '@ocom/service-payment';

export interface CommunityGetPaymentInstrumentCommand {
	communityId: string;
}

export const getPaymentInstrument = (dataSources: DataSources, paymentService: PaymentOperations) => {
	return async (command: CommunityGetPaymentInstrumentCommand): Promise<PaymentInstrumentDisplay | null> => {
		const community = await dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getById(command.communityId);
		const paymentInstrumentId = community?.finance.paymentInstrumentId;
		if (!paymentInstrumentId) {
			return null;
		}
		return await paymentService.getPaymentInstrument(paymentInstrumentId);
	};
};
