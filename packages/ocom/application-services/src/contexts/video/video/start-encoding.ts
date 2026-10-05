import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations, ClientUploadOperations } from '@ocom/service-blob-storage';
import { EncodingLinkLifetimeMs, videoOutputContainerName, videoOutputPrefix } from './video-storage.ts';

export interface VideoStartEncodingCommand {
	readonly videoId: string;
}

/** What the staff encoder needs to encode a video. */
export interface VideoStartEncodingResult {
	readonly video: Domain.Contexts.Video.Video.VideoEntityReference;
	/** Read link for the original, valid for 6 hours. */
	readonly sourceUrl: string;
	readonly outputContainerName: string;
	readonly outputPrefix: string;
}

export const startEncoding = (dataSources: DataSources, blobStorageService: BlobStorageOperations, clientOperationsService: ClientUploadOperations) => {
	return async (command: VideoStartEncodingCommand): Promise<VideoStartEncodingResult> => {
		let video: Domain.Contexts.Video.Video.VideoEntityReference | undefined;
		await dataSources.domainDataSource.Video.Video.VideoUnitOfWork.withScopedTransaction(async (repo) => {
			const existing = await repo.getById(command.videoId);
			existing.startEncoding({ containerName: videoOutputContainerName(existing.community.id), prefix: videoOutputPrefix(existing.id) });
			video = await repo.save(existing);
		});
		if (!video?.outputContainerName || !video.outputPrefix) {
			throw new Error('Video could not be started');
		}

		await blobStorageService.createContainerIfNotExists({ containerName: video.outputContainerName });
		const source = { containerName: video.sourceContainerName, blobName: video.sourceBlobName };
		const sasToken = await clientOperationsService.generateReadSasToken({ ...source, expiresOn: new Date(Date.now() + EncodingLinkLifetimeMs) });
		return {
			video,
			sourceUrl: `${blobStorageService.getBlobUrl(source)}?${sasToken}`,
			outputContainerName: video.outputContainerName,
			outputPrefix: video.outputPrefix,
		};
	};
};
