import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { queryByVideo, type VideoViewingQueryByVideoCommand } from './query-by-video.ts';
import { queryMine, type VideoViewingQueryMineCommand } from './query-mine.ts';
import { queryReplayHeatmap, type VideoReplayHeatmap, type VideoViewingQueryReplayHeatmapCommand } from './query-replay-heatmap.ts';
import { recordProgress, type VideoViewingRecordProgressCommand } from './record-progress.ts';

export interface VideoViewingApplicationService {
	/** Records spans the caller's player played, starting their viewing on the first report. */
	recordProgress: (command: VideoViewingRecordProgressCommand) => Promise<Domain.Contexts.Video.VideoViewing.VideoViewingEntityReference>;
	/** The caller's own viewing of a video, or null when they have not started watching it. */
	queryMine: (command: VideoViewingQueryMineCommand) => Promise<Domain.Contexts.Video.VideoViewing.VideoViewingEntityReference | null>;
	/** Viewings of a video the caller may see: everyone's for video managers, otherwise their own. */
	queryByVideo: (command: VideoViewingQueryByVideoCommand) => Promise<Domain.Contexts.Video.VideoViewing.VideoViewingEntityReference[]>;
	/** How often each part of a video was played again, across the viewings the caller may see. */
	queryReplayHeatmap: (command: VideoViewingQueryReplayHeatmapCommand) => Promise<VideoReplayHeatmap | null>;
}

export type { VideoReplayHeatmap };

export const VideoViewing = (dataSources: DataSources): VideoViewingApplicationService => {
	return {
		recordProgress: recordProgress(dataSources),
		queryMine: queryMine(dataSources),
		queryByVideo: queryByVideo(dataSources),
		queryReplayHeatmap: queryReplayHeatmap(dataSources),
	};
};
