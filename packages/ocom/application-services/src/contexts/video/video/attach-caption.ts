import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations } from '@ocom/service-blob-storage';
import { toWebVtt } from './caption-file.ts';
import { videoOutputContainerName } from './video-storage.ts';

export interface VideoAttachCaptionCommand {
	readonly videoId: string;
	/** BCP 47 language tag, such as `en` or `es-MX`. */
	readonly language: string;
	/** Name shown in the player's captions menu. */
	readonly label: string;
	/** `captions` (speech and sounds) or `subtitles` (translation). */
	readonly kind: string;
	/** Contents of a WebVTT or SubRip file. */
	readonly content: string;
}

/**
 * Attaches a caption file to a video, replacing any track in the same
 * language. The file is validated, converted to WebVTT, and stored next to
 * the encoded output in the community's video container, so the playback
 * token covers it. Works at any status.
 */
export const attachCaption = (dataSources: DataSources, blobStorageService: BlobStorageOperations) => {
	return async (command: VideoAttachCaptionCommand): Promise<Domain.Contexts.Video.Video.VideoEntityReference> => {
		const webVtt = toWebVtt(command.content);
		let video: Domain.Contexts.Video.Video.VideoEntityReference | undefined;
		await dataSources.domainDataSource.Video.Video.VideoUnitOfWork.withScopedTransaction(async (repo) => {
			const existing = await repo.getById(command.videoId);
			const track = existing.attachCaption({ language: command.language, label: command.label, kind: command.kind }, videoOutputContainerName(existing.community.id));
			await blobStorageService.createContainerIfNotExists({ containerName: track.containerName });
			await blobStorageService.uploadText({ containerName: track.containerName, blobName: track.blobName, text: webVtt, httpHeaders: { blobContentType: 'text/vtt; charset=utf-8' } });
			video = await repo.save(existing);
		});
		if (!video) {
			throw new Error('Video could not be updated');
		}
		return video;
	};
};
