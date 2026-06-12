import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations, UploadTextBlobRequest } from '@ocom/service-blob-storage';

export interface CommunityCreateCommand {
	name: string;
	endUserExternalId: string;
}

export const create = (dataSources: DataSources, blobStorageService: BlobStorageOperations) => {
	return async (command: CommunityCreateCommand): Promise<Domain.Contexts.Community.Community.CommunityEntityReference> => {
		const createdBy = await dataSources.readonlyDataSource.User.EndUser.EndUserReadRepo.getByExternalId(command.endUserExternalId);
		if (!createdBy) {
			throw new Error(`End user not found for external id ${command.endUserExternalId}`);
		}
		let communityToReturn: Domain.Contexts.Community.Community.CommunityEntityReference | undefined;
		await dataSources.domainDataSource.Community.Community.CommunityUnitOfWork.withScopedTransaction(async (repo) => {
			const newCommunity = await repo.getNewInstance(command.name, createdBy);
			communityToReturn = await repo.save(newCommunity);
		});

		// save log file to blob storage for the created community
		if (communityToReturn) {
			const logContent = `Community created with id: ${communityToReturn.id} and name: ${communityToReturn.name}`;
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
		return communityToReturn;
	};
};
