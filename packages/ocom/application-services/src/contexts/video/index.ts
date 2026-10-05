import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations, ClientUploadOperations } from '@ocom/service-blob-storage';
import { Video as VideoApi, type VideoApplicationService } from './video/index.ts';

export type { VideoPlaybackResult, VideoRequestUploadCommand, VideoRequestUploadResult, VideoUploadTarget } from './video/index.ts';

export interface VideoContextApplicationService {
	Video: VideoApplicationService;
}

export const Video = (dataSources: DataSources, blobStorageService: BlobStorageOperations, clientOperationsService: ClientUploadOperations): VideoContextApplicationService => {
	return {
		Video: VideoApi(dataSources, blobStorageService, clientOperationsService),
	};
};
