import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

/**
 * Videos the caller can encode now, across all communities, oldest first:
 * uploaded videos, failed videos (to retry), and videos already encoding (to
 * take over). Empty for callers without permission to encode videos.
 */
export const queryAwaitingEncoding = (dataSources: DataSources) => {
	return async (): Promise<Domain.Contexts.Video.Video.VideoEntityReference[]> => {
		const videos = await dataSources.readonlyDataSource.Video.Video.VideoReadRepo.getByStatuses(['UPLOADED', 'ENCODING', 'FAILED']);
		return videos.filter((video) => video.canEncode());
	};
};
