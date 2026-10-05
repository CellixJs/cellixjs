import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations, ClientUploadOperations } from '@ocom/service-blob-storage';
import { PlaybackTokenLifetimeMs } from './video-storage.ts';

export interface VideoGetPlaybackCommand {
	readonly videoId: string;
}

/**
 * What a player needs to stream a ready video: both manifest URLs and a
 * read-only SAS token for the community's video container. The token is
 * appended to every manifest and segment request.
 */
export interface VideoPlaybackResult {
	readonly dashManifestUrl: string;
	readonly hlsManifestUrl: string;
	readonly sasToken: string;
	readonly expiresAt: Date;
}

export const getPlayback = (dataSources: DataSources, blobStorageService: BlobStorageOperations, clientOperationsService: ClientUploadOperations) => {
	return async (command: VideoGetPlaybackCommand): Promise<VideoPlaybackResult> => {
		const video = await dataSources.readonlyDataSource.Video.Video.VideoReadRepo.getById(command.videoId);
		if (!video) {
			throw new Error('Video not found');
		}
		// Checks the caller may watch it and that it is ready.
		const playback = video.requestPlayback();
		const expiresAt = new Date(Date.now() + PlaybackTokenLifetimeMs);
		const sasToken = await clientOperationsService.generateContainerReadSasToken({ containerName: playback.containerName, expiresOn: expiresAt });
		return {
			dashManifestUrl: blobStorageService.getBlobUrl({ containerName: playback.containerName, blobName: playback.dashManifestBlobName }),
			hlsManifestUrl: blobStorageService.getBlobUrl({ containerName: playback.containerName, blobName: playback.hlsManifestBlobName }),
			sasToken,
			expiresAt,
		};
	};
};
