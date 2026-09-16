import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations, UploadTextBlobRequest } from '@ocom/service-blob-storage';
import type { PaymentInstrumentInput, PaymentOperations } from '@ocom/service-payment';
import type { QueueStorageOperations } from '@ocom/service-queue-storage';
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

		const createdBy = await dataSources.readonlyDataSource.User.EndUser.EndUserReadRepo.getByExternalId(command.endUserExternalId);
		if (!createdBy) {
			throw new Error(`End user not found for external id ${command.endUserExternalId}`);
		}
		let communityToReturn: Domain.Contexts.Community.Community.CommunityEntityReference | undefined;
		// Creating a community is self-service: the actor is not yet a member of it, so no
		// member visa can exist for a community that does not exist. The elevation is scoped
		// to this create transaction and the actor is recorded as createdBy.
		const createPassport = Domain.PassportFactory.forSystem({
			canManageCommunitySettings: true,
			isSystemAccount: true,
		});
		await dataSources.domainDataSource.Community.Community.CommunityUnitOfWork.withTransaction(createPassport, async (repo) => {
			const newCommunity = await repo.getNewInstance(command.name, createdBy);
			if (command.subscriptionTier) {
				newCommunity.finance.subscriptionTier = command.subscriptionTier;
			}
			if (command.paymentInstrument) {
				const instrument = await paymentService.createPaymentInstrument(command.paymentInstrument);
				newCommunity.finance.paymentInstrumentId = instrument.id;
			}
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
			communityToReturn = await processSubscriptionCharge(
				dataSources,
				paymentService,
			)({
				communityId: communityToReturn.id,
				useSystemPassport: true,
			});
		}

		return communityToReturn;
	};
};
