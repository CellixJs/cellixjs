import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations, ClientUploadOperations } from '@ocom/service-blob-storage';
import { EncodingLinkLifetimeMs } from './video-storage.ts';

export interface VideoRequestOutputUploadsCommand {
	readonly videoId: string;
	/** Output file paths relative to the video's output prefix, for example `video/720/1.m4s`. */
	readonly paths: readonly string[];
}

/** A write link for one encoded file: `PUT` it to `url` with `x-ms-blob-type: BlockBlob`. */
export interface VideoOutputUpload {
	readonly path: string;
	readonly url: string;
}

/**
 * Issues a 6-hour write link per output file. The domain checks the caller
 * may encode the video, that it is encoding, and that every path stays inside
 * the video's output prefix.
 */
export const requestOutputUploads = (dataSources: DataSources, blobStorageService: BlobStorageOperations, clientOperationsService: ClientUploadOperations) => {
	return async (command: VideoRequestOutputUploadsCommand): Promise<VideoOutputUpload[]> => {
		const video = await dataSources.readonlyDataSource.Video.Video.VideoReadRepo.getById(command.videoId);
		if (!video?.outputContainerName) {
			throw new Error('Video not found');
		}
		const containerName = video.outputContainerName;
		const blobNames = video.resolveOutputBlobNames(command.paths);
		const expiresOn = new Date(Date.now() + EncodingLinkLifetimeMs);
		return await Promise.all(
			blobNames.map(async (blobName, index) => {
				const sasToken = await clientOperationsService.generateWriteSasToken({ containerName, blobName, expiresOn });
				return { path: command.paths[index] as string, url: `${blobStorageService.getBlobUrl({ containerName, blobName })}?${sasToken}` };
			}),
		);
	};
};
