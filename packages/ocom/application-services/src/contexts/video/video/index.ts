import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations, ClientUploadOperations } from '@ocom/service-blob-storage';
import { attachCaption, type VideoAttachCaptionCommand } from './attach-caption.ts';
import { completeUpload, type VideoCompleteUploadCommand } from './complete-upload.ts';
import { getPlayback, type VideoGetPlaybackCommand, type VideoPlaybackResult } from './get-playback.ts';
import { queryAwaitingEncoding } from './query-awaiting-encoding.ts';
import { queryByCommunity, type VideoQueryByCommunityCommand } from './query-by-community.ts';
import { queryById, type VideoQueryByIdCommand } from './query-by-id.ts';
import { recordEncodingResult, type VideoEncodingResultCommand } from './record-encoding-result.ts';
import { removeCaption, type VideoRemoveCaptionCommand } from './remove-caption.ts';
import { requestOutputUploads, type VideoOutputUpload, type VideoRequestOutputUploadsCommand } from './request-output-uploads.ts';
import { requestUpload, type VideoRequestUploadCommand, type VideoRequestUploadResult } from './request-upload.ts';
import { startEncoding, type VideoStartEncodingCommand, type VideoStartEncodingResult } from './start-encoding.ts';

export type { VideoPlaybackResult } from './get-playback.ts';
export type { VideoEncodingResultCommand } from './record-encoding-result.ts';
export type { VideoOutputUpload } from './request-output-uploads.ts';
export type { VideoRequestUploadCommand, VideoRequestUploadResult, VideoUploadTarget } from './request-upload.ts';
export type { VideoStartEncodingResult } from './start-encoding.ts';

export interface VideoApplicationService {
	/** Creates a video awaiting upload and returns a signed request for the browser to upload the original. */
	requestUpload: (command: VideoRequestUploadCommand) => Promise<VideoRequestUploadResult>;
	/** Confirms the original arrived with the declared size and marks the video uploaded. */
	completeUpload: (command: VideoCompleteUploadCommand) => Promise<Domain.Contexts.Video.Video.VideoEntityReference>;
	queryByCommunity: (command: VideoQueryByCommunityCommand) => Promise<Domain.Contexts.Video.Video.VideoEntityReference[]>;
	queryById: (command: VideoQueryByIdCommand) => Promise<Domain.Contexts.Video.Video.VideoEntityReference | null>;
	/** Manifest URLs and a short-lived read token for a ready video. */
	getPlayback: (command: VideoGetPlaybackCommand) => Promise<VideoPlaybackResult>;
	/** Staff: videos the caller can encode now, across all communities, oldest first. */
	queryAwaitingEncoding: () => Promise<Domain.Contexts.Video.Video.VideoEntityReference[]>;
	/** Staff: marks a video encoding and returns a read link for the original and the output destination. */
	startEncoding: (command: VideoStartEncodingCommand) => Promise<VideoStartEncodingResult>;
	/** Staff: write links for encoded output files. */
	requestOutputUploads: (command: VideoRequestOutputUploadsCommand) => Promise<VideoOutputUpload[]>;
	/** Staff: records a successful or failed encode. */
	recordEncodingResult: (command: VideoEncodingResultCommand) => Promise<Domain.Contexts.Video.Video.VideoEntityReference>;
	/** Attaches a WebVTT or SubRip caption file, replacing any track in the same language. */
	attachCaption: (command: VideoAttachCaptionCommand) => Promise<Domain.Contexts.Video.Video.VideoEntityReference>;
	/** Removes a caption track and deletes its file. */
	removeCaption: (command: VideoRemoveCaptionCommand) => Promise<Domain.Contexts.Video.Video.VideoEntityReference>;
}

export const Video = (dataSources: DataSources, blobStorageService: BlobStorageOperations, clientOperationsService: ClientUploadOperations): VideoApplicationService => {
	return {
		requestUpload: requestUpload(dataSources, blobStorageService, clientOperationsService),
		completeUpload: completeUpload(dataSources, blobStorageService),
		queryByCommunity: queryByCommunity(dataSources),
		queryById: queryById(dataSources),
		getPlayback: getPlayback(dataSources, blobStorageService, clientOperationsService),
		queryAwaitingEncoding: queryAwaitingEncoding(dataSources),
		startEncoding: startEncoding(dataSources, blobStorageService, clientOperationsService),
		requestOutputUploads: requestOutputUploads(dataSources, blobStorageService, clientOperationsService),
		recordEncodingResult: recordEncodingResult(dataSources),
		attachCaption: attachCaption(dataSources, blobStorageService),
		removeCaption: removeCaption(dataSources, blobStorageService),
	};
};
