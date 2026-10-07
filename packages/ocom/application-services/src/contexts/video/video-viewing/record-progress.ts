import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface VideoViewingRecordProgressCommand {
	readonly videoId: string;
	/** The member watching, who must be the caller. */
	readonly memberId: string;
	/** Spans of the video the player played, in seconds. */
	readonly ranges: readonly Domain.Contexts.Video.VideoViewing.VideoTimeRange[];
}

/** MongoDB's duplicate key error, raised when two first reports create the same viewing at once. */
const isDuplicateKeyError = (error: unknown): boolean => (error as { code?: unknown } | null)?.code === 11000;

/**
 * Records what a member's player has played, starting the member's viewing of
 * the video on the first report. If two first reports race and both try to
 * create the viewing, the loser retries once and updates the viewing the
 * winner created.
 */
export const recordProgress = (dataSources: DataSources) => {
	return async (command: VideoViewingRecordProgressCommand): Promise<Domain.Contexts.Video.VideoViewing.VideoViewingEntityReference> => {
		const video = await dataSources.readonlyDataSource.Video.Video.VideoReadRepo.getById(command.videoId);
		if (!video) {
			throw new Error('Video not found');
		}

		const record = async () => {
			let viewing: Domain.Contexts.Video.VideoViewing.VideoViewingEntityReference | undefined;
			await dataSources.domainDataSource.Video.VideoViewing.VideoViewingUnitOfWork.withScopedTransaction(async (repo) => {
				const now = new Date();
				const existing = (await repo.getByVideoAndMember(command.videoId, command.memberId)) ?? (await repo.getNewInstance(video, command.memberId, now));
				existing.recordProgress(command.ranges, now);
				viewing = await repo.save(existing);
			});
			if (!viewing) {
				throw new Error('Viewing could not be recorded');
			}
			return viewing;
		};

		try {
			return await record();
		} catch (error) {
			if (!isDuplicateKeyError(error)) {
				throw error;
			}
			return await record();
		}
	};
};
