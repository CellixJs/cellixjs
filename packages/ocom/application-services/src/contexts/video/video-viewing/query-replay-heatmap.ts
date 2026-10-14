import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface VideoViewingQueryReplayHeatmapCommand {
	readonly videoId: string;
}

/** Replay counts for a video, added up across the viewings the caller may see. */
export interface VideoReplayHeatmap {
	/** Length of each part of the video, in seconds. */
	readonly bucketSeconds: number;
	/** How many parts the video is split into. */
	readonly bucketCount: number;
	/** Times each part was played again before members finished the video, by part. */
	readonly firstWatch: readonly number[];
	/** Times each part was played again after members finished the video, by part. */
	readonly postCompletion: readonly number[];
	/** How many viewings the counts come from. */
	readonly viewingCount: number;
}

/** Adds each viewing's counts onto a tally of `length` parts, ignoring counts past the end. */
function sumByBucket(tallies: readonly (readonly number[])[], length: number): number[] {
	const total = new Array<number>(length).fill(0);
	for (const counts of tallies) {
		for (let index = 0; index < Math.min(counts.length, length); index++) {
			total[index] = (total[index] ?? 0) + (counts[index] ?? 0);
		}
	}
	return total;
}

/**
 * How often each part of a video was played again, across the viewings the
 * caller may see. A part replayed before a member finished the video is a
 * rewind; one replayed after they finished is a return visit.
 *
 * Returns `null` when nobody has watched the video, so there is nothing to show.
 */
export const queryReplayHeatmap = (dataSources: DataSources) => {
	return async (command: VideoViewingQueryReplayHeatmapCommand): Promise<VideoReplayHeatmap | null> => {
		const video = await dataSources.readonlyDataSource.Video.Video.VideoReadRepo.getById(command.videoId);
		const durationSeconds = video?.durationSeconds;
		if (!durationSeconds || durationSeconds <= 0) {
			return null;
		}
		const viewings = (await dataSources.readonlyDataSource.Video.VideoViewing.VideoViewingReadRepo.getByVideoId(command.videoId)).filter((viewing) => viewing.canView());
		if (viewings.length === 0) {
			return null;
		}
		// The video's own length decides the parts, so a video re-encoded shorter does not show counts past its end.
		const bucketSeconds = Domain.Contexts.Video.VideoViewing.BucketSeconds;
		const bucketCount = Math.max(1, Math.ceil(durationSeconds / bucketSeconds));
		return {
			bucketSeconds,
			bucketCount,
			firstWatch: sumByBucket(
				viewings.map((viewing) => viewing.firstWatchReplays),
				bucketCount,
			),
			postCompletion: sumByBucket(
				viewings.map((viewing) => viewing.postCompletionReplays),
				bucketCount,
			),
			viewingCount: viewings.length,
		};
	};
};
