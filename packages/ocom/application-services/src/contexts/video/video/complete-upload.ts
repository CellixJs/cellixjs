import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations } from '@ocom/service-blob-storage';

export interface VideoCompleteUploadCommand {
	readonly videoId: string;
}

/**
 * Confirms that the original, and its audio description when there is one,
 * reached Blob Storage with the declared sizes, and marks the video `UPLOADED`
 * so staff can encode it. Safe to repeat.
 */
export const completeUpload = (dataSources: DataSources, blobStorageService: BlobStorageOperations) => {
	return async (command: VideoCompleteUploadCommand): Promise<Domain.Contexts.Video.Video.VideoEntityReference> => {
		let video: Domain.Contexts.Video.Video.VideoEntityReference | undefined;
		await dataSources.domainDataSource.Video.Video.VideoUnitOfWork.withScopedTransaction(async (repo) => {
			const existing = await repo.getById(command.videoId);
			await ensureReceived(blobStorageService, { containerName: existing.sourceContainerName, blobName: existing.sourceBlobName, sizeBytes: existing.sourceSizeBytes }, 'upload');
			const { audioDescription } = existing;
			if (audioDescription) {
				await ensureReceived(blobStorageService, audioDescription, 'audio description upload');
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

async function ensureReceived(blobStorageService: BlobStorageOperations, expected: { containerName: string; blobName: string; sizeBytes: number }, what: string): Promise<void> {
	const properties = await blobStorageService.getBlobProperties({ containerName: expected.containerName, blobName: expected.blobName });
	if (!properties) {
		throw new Error(`The ${what} has not been received`);
	}
	if (properties.contentLength !== expected.sizeBytes) {
		throw new Error(`The ${what} is ${properties.contentLength} bytes but ${expected.sizeBytes} bytes were expected`);
	}
}
