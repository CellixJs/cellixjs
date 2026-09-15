import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations } from '@ocom/service-blob-storage';
import type { PaymentInstrumentDisplay, PaymentOperations } from '@ocom/service-payment';
import type { QueueStorageOperations } from '@ocom/service-queue-storage';
import { type CommunityCreateCommand, create } from './create.ts';
import { type CommunityGetPaymentInstrumentCommand, getPaymentInstrument } from './get-payment-instrument.ts';
import { type CommunityProcessSubscriptionChargeCommand, processSubscriptionCharge } from './process-subscription-charge.ts';
import { type CommunityQueryByEndUserExternalIdCommand, queryByEndUserExternalId } from './query-by-end-user-external-id.ts';
import { type CommunityQueryByIdCommand, queryById } from './query-by-id.ts';
import { type CommunityQuerySubscriptionCommand, type CommunitySubscriptionView, querySubscription } from './query-subscription.ts';
import { type CommunityUpdatePaymentInstrumentCommand, updatePaymentInstrument } from './update-payment-instrument.ts';
import { type CommunityUpdateSettingsCommand, updateSettings } from './update-settings.ts';
import { type CommunityUpdateSubscriptionTierCommand, updateSubscriptionTier } from './update-subscription-tier.ts';

export type { CommunityCreateCommand, CommunityProcessSubscriptionChargeCommand, CommunitySubscriptionView, CommunityUpdatePaymentInstrumentCommand, CommunityUpdateSettingsCommand, CommunityUpdateSubscriptionTierCommand };

export interface CommunityApplicationService {
	create: (command: CommunityCreateCommand) => Promise<Domain.Contexts.Community.Community.CommunityEntityReference>;
	queryById: (command: CommunityQueryByIdCommand) => Promise<Domain.Contexts.Community.Community.CommunityEntityReference | null>;
	queryByEndUserExternalId: (command: CommunityQueryByEndUserExternalIdCommand) => Promise<Domain.Contexts.Community.Community.CommunityEntityReference[]>;
	updateSettings: (command: CommunityUpdateSettingsCommand) => Promise<Domain.Contexts.Community.Community.CommunityEntityReference>;
	updateSubscriptionTier: (command: CommunityUpdateSubscriptionTierCommand) => Promise<Domain.Contexts.Community.Community.CommunityEntityReference>;
	updatePaymentInstrument: (command: CommunityUpdatePaymentInstrumentCommand) => Promise<Domain.Contexts.Community.Community.CommunityEntityReference>;
	processSubscriptionCharge: (command: CommunityProcessSubscriptionChargeCommand) => Promise<Domain.Contexts.Community.Community.CommunityEntityReference>;
	querySubscription: (command: CommunityQuerySubscriptionCommand) => Promise<CommunitySubscriptionView | null>;
	getPaymentInstrument: (command: CommunityGetPaymentInstrumentCommand) => Promise<PaymentInstrumentDisplay | null>;
}

export const Community = (dataSources: DataSources, blobStorageService: BlobStorageOperations, queueStorageService: QueueStorageOperations, paymentService: PaymentOperations): CommunityApplicationService => {
	return {
		create: create(dataSources, blobStorageService, queueStorageService, paymentService),
		queryById: queryById(dataSources),
		queryByEndUserExternalId: queryByEndUserExternalId(dataSources),
		updateSettings: updateSettings(dataSources),
		updateSubscriptionTier: updateSubscriptionTier(dataSources),
		updatePaymentInstrument: updatePaymentInstrument(dataSources, paymentService),
		processSubscriptionCharge: processSubscriptionCharge(dataSources, paymentService),
		querySubscription: querySubscription(dataSources),
		getPaymentInstrument: getPaymentInstrument(dataSources, paymentService),
	};
};
