import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations, UploadTextBlobRequest } from '@ocom/service-blob-storage';
import type { PaymentInstrumentInput, PaymentOperations } from '@ocom/service-payment';
import type { QueueStorageOperations } from '@ocom/service-queue-storage';
import { ensureDefaultConfigs } from './ensure-default-configs.ts';
import { processSubscriptionCharge } from './process-subscription-charge.ts';

export interface CommunityCreateCommand {
	name: string;
	endUserExternalId: string;
	subscriptionTier?: string | undefined;
	paymentInstrument?: PaymentInstrumentInput | undefined;
}

export const create = (dataSources: DataSources, blobStorageService: BlobStorageOperations, queueStorageService: QueueStorageOperations, paymentService: PaymentOperations) => {
	return async (command: CommunityCreateCommand): Promise<Domain.Contexts.Community.Community.CommunityEntityReference> => {
		if (command.paymentInstrument !== undefined) {
			const paymentToken = command.paymentInstrument.paymentToken?.trim() ?? '';
			if (!paymentToken) {
				throw new Error('A payment instrument token is required');
			}
		}

		// The plan is validated before anything is vaulted or written: failing later would
		// leave an orphan community behind and a retry would create a second one.
		await ensureDefaultConfigs(dataSources);
		const requestedTier = command.subscriptionTier ?? Domain.Contexts.Community.Community.ValueObjects.SubscriptionTiers.Pro;
		const tierConfig = await dataSources.readonlyDataSource.Community.CommunityConfig.CommunityConfigReadRepo.getLatestEffective(requestedTier);
		if (!tierConfig) {
			throw new Error(`No community config found for subscription tier ${requestedTier}`);
		}

		const createdBy = await dataSources.readonlyDataSource.User.EndUser.EndUserReadRepo.getByExternalId(command.endUserExternalId);
		if (!createdBy) {
			throw new Error(`End user not found for external id ${command.endUserExternalId}`);
		}
		let communityToReturn: Domain.Contexts.Community.Community.CommunityEntityReference | undefined;
		// The instrument is vaulted before the transaction opens: holding a Mongo
		// transaction across gateway I/O risks aborting after the card was already
		// vaulted, which would orphan the stored instrument.
		const vaultedInstrumentId = command.paymentInstrument ? (await paymentService.createPaymentInstrument(command.paymentInstrument)).id : undefined;

		await dataSources.domainDataSource.Community.Community.CommunityUnitOfWork.withScopedTransaction(async (repo) => {
			// The tier and instrument are applied while the community is still new, so the
			// request's own passport is sufficient and no elevation is needed.
			const newCommunity = await repo.getNewInstance(command.name, createdBy, requestedTier, vaultedInstrumentId);
			communityToReturn = await repo.save(newCommunity);
		});

		// save log file to blob storage for the created community
		if (communityToReturn) {
			const logContent = `Community created with id: ${communityToReturn.id} and name: ${communityToReturn.name}`;
			try {
				await queueStorageService.sendMessageToCommunityCreationQueue({
					communityId: communityToReturn.id,
					name: communityToReturn.name,
					createdBy: communityToReturn.createdBy.id,
				});
			} catch (error) {
				console.error('Failed to send community creation message to queue storage:', error);
			}
			try {
				const uploadRequest: UploadTextBlobRequest = {
					containerName: 'private',
					blobName: `community-${communityToReturn.id}-creation.log`,
					text: logContent,
					metadata: {
						communityId: communityToReturn.id,
						eventType: 'CommunityCreated',
					},
				};
				await blobStorageService.uploadText(uploadRequest);
			} catch (error) {
				console.error('Failed to upload community creation log to blob storage:', error);
			}
		}

		if (!communityToReturn) {
			throw new Error('community not found');
		}

		await Domain.Services.Community.CommunityProvisioningService.provisionMemberAndDefaultRole(communityToReturn.id, dataSources.domainDataSource);

		if (communityToReturn.finance.paymentInstrumentId) {
			// The community is already committed, so a charge problem must not fail the
			// create and invite a retry that creates a second community. A declined card is
			// recorded as a failed transaction by processSubscriptionCharge itself; this only
			// catches infrastructure faults, which the admin can retry from the billing screen.
			try {
				communityToReturn = await processSubscriptionCharge(
					dataSources,
					paymentService,
				)({
					communityId: communityToReturn.id,
					useSystemPassport: true,
				});
			} catch (error) {
				console.error('Failed to process the initial subscription charge for the new community:', error);
			}
		}

		return communityToReturn;
	};
};
