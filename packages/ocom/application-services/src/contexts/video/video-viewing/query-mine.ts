import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface VideoViewingQueryMineCommand {
	readonly videoId: string;
	/** The member asking, who must be the caller. */
	readonly memberId: string;
}

/** The caller's own viewing of a video, or null when they have not started watching it. */
export const queryMine = (dataSources: DataSources) => {
	return async (command: VideoViewingQueryMineCommand): Promise<Domain.Contexts.Video.VideoViewing.VideoViewingEntityReference | null> => {
		const viewing = await dataSources.readonlyDataSource.Video.VideoViewing.VideoViewingReadRepo.getByVideoAndMember(command.videoId, command.memberId);
		return viewing?.canView() ? viewing : null;
	};
};
