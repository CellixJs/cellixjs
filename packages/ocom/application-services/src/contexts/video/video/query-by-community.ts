import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface VideoQueryByCommunityCommand {
	readonly communityId: string;
}

/** A community's videos, newest first. */
export const queryByCommunity = (dataSources: DataSources) => {
	return async (command: VideoQueryByCommunityCommand): Promise<Domain.Contexts.Video.Video.VideoEntityReference[]> => {
		return await dataSources.readonlyDataSource.Video.Video.VideoReadRepo.getByCommunityId(command.communityId);
	};
};
