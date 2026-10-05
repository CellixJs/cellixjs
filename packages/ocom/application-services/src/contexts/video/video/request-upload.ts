import { randomUUID } from 'node:crypto';
import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations, ClientUploadOperations } from '@ocom/service-blob-storage';
import { VideoUploadContainerName } from './video-storage.ts';

export interface VideoRequestUploadCommand {
	readonly communityId: string;
	readonly title: string;
	readonly contentType: string;
	readonly sizeBytes: number;
}

/**
 * A signed request the browser sends to upload the original directly to Blob
 * Storage: `PUT` the file to `url` with exactly these headers. The browser
 * sets `Content-Length` itself, so it is not included; the file must still be
 * exactly `sizeBytes` long, and the upload must start within about 15 minutes.
 */
export interface VideoUploadTarget {
	readonly url: string;
	readonly headers: Record<string, string>;
}

export interface VideoRequestUploadResult {
	readonly video: Domain.Contexts.Video.Video.VideoEntityReference;
	readonly upload: VideoUploadTarget;
}

export const requestUpload = (dataSources: DataSources, blobStorageService: BlobStorageOperations, clientOperationsService: ClientUploadOperations) => {
	return async (command: VideoRequestUploadCommand): Promise<VideoRequestUploadResult> => {
		const community = await dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getById(command.communityId);
		if (!community) {
			throw new Error('Community not found');
		}

		const blobName = `${command.communityId}/${randomUUID()}`;
		let video: Domain.Contexts.Video.Video.VideoEntityReference | undefined;
		await dataSources.domainDataSource.Video.Video.VideoUnitOfWork.withScopedTransaction(async (repo) => {
			const newVideo = await repo.getNewInstance(command.title, { containerName: VideoUploadContainerName, blobName, contentType: command.contentType, sizeBytes: command.sizeBytes }, community);
			video = await repo.save(newVideo);
		});
		if (!video) {
			throw new Error('Video could not be created');
		}

		await blobStorageService.createContainerIfNotExists({ containerName: VideoUploadContainerName });
		const signed = await clientOperationsService.createBlobWriteAuthorizationHeader({
			containerName: VideoUploadContainerName,
			blobName,
			contentLength: command.sizeBytes,
			contentType: command.contentType,
		});
		const { 'Content-Length': _contentLength, ...headers } = signed.headers;

		return { video, upload: { url: signed.url, headers: { ...headers, Authorization: signed.authorizationHeader } } };
	};
};
