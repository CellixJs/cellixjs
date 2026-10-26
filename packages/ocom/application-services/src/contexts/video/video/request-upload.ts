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
	/** An English audio description to upload alongside the video: the soundtrack mixed with narration. */
	readonly audioDescription?: { readonly contentType: string; readonly sizeBytes: number } | undefined;
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
	/** Where to upload the audio description, when the command included one. */
	readonly audioDescriptionUpload: VideoUploadTarget | null;
}

export const requestUpload = (dataSources: DataSources, blobStorageService: BlobStorageOperations, clientOperationsService: ClientUploadOperations) => {
	return async (command: VideoRequestUploadCommand): Promise<VideoRequestUploadResult> => {
		const community = await dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getById(command.communityId);
		if (!community) {
			throw new Error('Community not found');
		}

		const blobName = `${command.communityId}/${randomUUID()}`;
		const audioDescription = command.audioDescription ? { containerName: VideoUploadContainerName, blobName: `${blobName}-audio-description`, ...command.audioDescription } : undefined;
		let video: Domain.Contexts.Video.Video.VideoEntityReference | undefined;
		await dataSources.domainDataSource.Video.Video.VideoUnitOfWork.withScopedTransaction(async (repo) => {
			const newVideo = await repo.getNewInstance(command.title, { containerName: VideoUploadContainerName, blobName, contentType: command.contentType, sizeBytes: command.sizeBytes }, community);
			if (audioDescription) {
				newVideo.attachAudioDescription(audioDescription);
			}
			video = await repo.save(newVideo);
		});
		if (!video) {
			throw new Error('Video could not be created');
		}

		await blobStorageService.createContainerIfNotExists({ containerName: VideoUploadContainerName });
		const signUpload = async (target: { blobName: string; contentType: string; sizeBytes: number }): Promise<VideoUploadTarget> => {
			const signed = await clientOperationsService.createBlobWriteAuthorizationHeader({
				containerName: VideoUploadContainerName,
				blobName: target.blobName,
				contentLength: target.sizeBytes,
				contentType: target.contentType,
			});
			const { 'Content-Length': _contentLength, ...headers } = signed.headers;
			return { url: signed.url, headers: { ...headers, Authorization: signed.authorizationHeader } };
		};

		return {
			video,
			upload: await signUpload({ blobName, contentType: command.contentType, sizeBytes: command.sizeBytes }),
			audioDescriptionUpload: audioDescription ? await signUpload(audioDescription) : null,
		};
	};
};
