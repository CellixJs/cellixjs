import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations } from '@ocom/service-blob-storage';

export interface VideoCompleteUploadCommand {
	readonly videoId: string;
}

/**
 * Confirms that the original reached Blob Storage with the declared size, and
 * marks the video `UPLOADED` so staff can encode it. Safe to repeat.
 */
export const completeUpload = (dataSources: DataSources, blobStorageService: BlobStorageOperations) => {
	return async (command: VideoCompleteUploadCommand): Promise<Domain.Contexts.Video.Video.VideoEntityReference> => {
		let video: Domain.Contexts.Video.Video.VideoEntityReference | undefined;
		await dataSources.domainDataSource.Video.Video.VideoUnitOfWork.withScopedTransaction(async (repo) => {
			const existing = await repo.getById(command.videoId);
			const properties = await blobStorageService.getBlobProperties({ containerName: existing.sourceContainerName, blobName: existing.sourceBlobName });
			if (!properties) {
				throw new Error('The upload has not been received');
			}
			if (properties.contentLength !== existing.sourceSizeBytes) {
				throw new Error(`The upload is ${properties.contentLength} bytes but ${existing.sourceSizeBytes} bytes were expected`);
			}
			existing.markUploadCompleted();
			video = await repo.save(existing);
		});
		if (!video) {
			throw new Error('Video could not be updated');
		}
		return video;
	};
};
