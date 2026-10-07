import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations, ClientUploadOperations } from '@ocom/service-blob-storage';
import { PlaybackTokenLifetimeMs } from './video-storage.ts';

export interface VideoGetPlaybackCommand {
	readonly videoId: string;
}

/** A caption file attached to the video, served as WebVTT. */
interface VideoPlaybackCaptionTrack {
	readonly language: string;
	readonly label: string;
	readonly kind: 'captions' | 'subtitles';
	readonly url: string;
}

/**
 * What a player needs to stream a ready video: both manifest URLs, any
 * attached caption files, and a read-only SAS token for the community's video
 * container. The token is appended to every manifest, segment, and caption
 * request.
 */
export interface VideoPlaybackResult {
	readonly dashManifestUrl: string;
	readonly hlsManifestUrl: string;
	readonly captionTracks: readonly VideoPlaybackCaptionTrack[];
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
			// Only tracks in the container the token covers can be read with it.
			captionTracks: playback.captionTracks
				.filter((track) => track.containerName === playback.containerName)
				.map((track) => ({ language: track.language, label: track.label, kind: track.kind, url: blobStorageService.getBlobUrl({ containerName: track.containerName, blobName: track.blobName }) })),
			sasToken,
			expiresAt,
		};
	};
};
