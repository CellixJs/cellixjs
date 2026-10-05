import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations, ClientUploadOperations } from '@ocom/service-blob-storage';
import { completeUpload, type VideoCompleteUploadCommand } from './complete-upload.ts';
import { getPlayback, type VideoGetPlaybackCommand, type VideoPlaybackResult } from './get-playback.ts';
import { queryByCommunity, type VideoQueryByCommunityCommand } from './query-by-community.ts';
import { queryById, type VideoQueryByIdCommand } from './query-by-id.ts';
import { requestUpload, type VideoRequestUploadCommand, type VideoRequestUploadResult } from './request-upload.ts';

export type { VideoPlaybackResult } from './get-playback.ts';
export type { VideoRequestUploadCommand, VideoRequestUploadResult, VideoUploadTarget } from './request-upload.ts';

export interface VideoApplicationService {
	/** Creates a video awaiting upload and returns a signed request for the browser to upload the original. */
	requestUpload: (command: VideoRequestUploadCommand) => Promise<VideoRequestUploadResult>;
	/** Confirms the original arrived with the declared size and marks the video uploaded. */
	completeUpload: (command: VideoCompleteUploadCommand) => Promise<Domain.Contexts.Video.Video.VideoEntityReference>;
	queryByCommunity: (command: VideoQueryByCommunityCommand) => Promise<Domain.Contexts.Video.Video.VideoEntityReference[]>;
	queryById: (command: VideoQueryByIdCommand) => Promise<Domain.Contexts.Video.Video.VideoEntityReference | null>;
	/** Manifest URLs and a short-lived read token for a ready video. */
	getPlayback: (command: VideoGetPlaybackCommand) => Promise<VideoPlaybackResult>;
}

export const Video = (dataSources: DataSources, blobStorageService: BlobStorageOperations, clientOperationsService: ClientUploadOperations): VideoApplicationService => {
	return {
		requestUpload: requestUpload(dataSources, blobStorageService, clientOperationsService),
		completeUpload: completeUpload(dataSources, blobStorageService),
		queryByCommunity: queryByCommunity(dataSources),
		queryById: queryById(dataSources),
		getPlayback: getPlayback(dataSources, blobStorageService, clientOperationsService),
	};
};
