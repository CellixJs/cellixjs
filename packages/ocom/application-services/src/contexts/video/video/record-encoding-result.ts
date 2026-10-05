import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

/** Result reported by the staff encoder. Manifest paths are relative to the video's output prefix. */
export type VideoEncodingResultCommand =
	| {
			readonly videoId: string;
			readonly succeeded: { readonly dashManifestPath: string; readonly hlsManifestPath: string; readonly durationSeconds: number; readonly renditionHeights: readonly number[] };
	  }
	| { readonly videoId: string; readonly failed: { readonly code: string; readonly message: string } };

export const recordEncodingResult = (dataSources: DataSources) => {
	return async (command: VideoEncodingResultCommand): Promise<Domain.Contexts.Video.Video.VideoEntityReference> => {
		let video: Domain.Contexts.Video.Video.VideoEntityReference | undefined;
		await dataSources.domainDataSource.Video.Video.VideoUnitOfWork.withScopedTransaction(async (repo) => {
			const existing = await repo.getById(command.videoId);
			if ('succeeded' in command) {
				const [dashManifestBlobName, hlsManifestBlobName] = existing.resolveOutputBlobNames([command.succeeded.dashManifestPath, command.succeeded.hlsManifestPath]) as [string, string];
				existing.recordEncodingSucceeded({
					dashManifestBlobName,
					hlsManifestBlobName,
					durationSeconds: command.succeeded.durationSeconds,
					renditionHeights: [...command.succeeded.renditionHeights],
				});
			} else {
				existing.recordEncodingFailed({ code: command.failed.code, message: command.failed.message });
			}
			video = await repo.save(existing);
		});
		if (!video) {
			throw new Error('Video could not be updated');
		}
		return video;
	};
};
