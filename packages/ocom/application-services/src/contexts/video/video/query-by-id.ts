import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface VideoQueryByIdCommand {
	readonly id: string;
}

export const queryById = (dataSources: DataSources) => {
	return async (command: VideoQueryByIdCommand): Promise<Domain.Contexts.Video.Video.VideoEntityReference | null> => {
		return await dataSources.readonlyDataSource.Video.Video.VideoReadRepo.getById(command.id);
	};
};
