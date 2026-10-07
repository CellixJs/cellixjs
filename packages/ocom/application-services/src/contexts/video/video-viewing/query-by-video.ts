import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface VideoViewingQueryByVideoCommand {
	readonly videoId: string;
}

/**
 * Viewings of a video the caller may see, most recently updated first:
 * everyone's for members who manage the community's videos, otherwise only
 * the caller's own.
 */
export const queryByVideo = (dataSources: DataSources) => {
	return async (command: VideoViewingQueryByVideoCommand): Promise<Domain.Contexts.Video.VideoViewing.VideoViewingEntityReference[]> => {
		const viewings = await dataSources.readonlyDataSource.Video.VideoViewing.VideoViewingReadRepo.getByVideoId(command.videoId);
		return viewings.filter((viewing) => viewing.canView());
	};
};
