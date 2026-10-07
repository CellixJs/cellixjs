import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations } from '@ocom/service-blob-storage';

export interface VideoRemoveCaptionCommand {
	readonly videoId: string;
	readonly language: string;
}

/**
 * Removes a video's caption track and then deletes its file. If deleting the
 * file fails, the track is still removed: a leftover file is not referenced,
 * and attaching captions in that language again overwrites it.
 */
export const removeCaption = (dataSources: DataSources, blobStorageService: BlobStorageOperations) => {
	return async (command: VideoRemoveCaptionCommand): Promise<Domain.Contexts.Video.Video.VideoEntityReference> => {
		let video: Domain.Contexts.Video.Video.VideoEntityReference | undefined;
		let removed: Domain.Contexts.Video.Video.VideoCaptionTrack | undefined;
		await dataSources.domainDataSource.Video.Video.VideoUnitOfWork.withScopedTransaction(async (repo) => {
			const existing = await repo.getById(command.videoId);
			removed = existing.removeCaption(command.language);
			video = await repo.save(existing);
		});
		if (!video || !removed) {
			throw new Error('Video could not be updated');
		}
		try {
			await blobStorageService.deleteBlob({ containerName: removed.containerName, blobName: removed.blobName });
		} catch (error) {
			console.error('Video > removeCaption : could not delete caption file', removed.blobName, error);
		}
		return video;
	};
};
