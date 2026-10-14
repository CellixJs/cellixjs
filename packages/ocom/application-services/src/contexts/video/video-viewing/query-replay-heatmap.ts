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

/** Adds each viewing's counts onto a tally of `length` parts. */
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
		const viewings = (await dataSources.readonlyDataSource.Video.VideoViewing.VideoViewingReadRepo.getByVideoId(command.videoId)).filter((viewing) => viewing.canView());
		const first = viewings[0];
		if (!first) {
			return null;
		}
		// A video re-encoded to a different length leaves viewings with different bucket counts; the longest covers them all.
		const bucketCount = viewings.reduce((most, viewing) => Math.max(most, viewing.bucketCount), 0);
		return {
			bucketSeconds: first.bucketSeconds,
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
