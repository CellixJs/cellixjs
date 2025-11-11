import type { CommunityEntityReference } from '@ocom/domain/contexts/community/community';
import type { DataSources } from '@ocom/persistence';

export interface CommunityQueryByIdCommand {
	id: string;
	fields?: string[];
}

export const queryById = (dataSources: DataSources) => {
	return async (
		command: CommunityQueryByIdCommand,
	): Promise<CommunityEntityReference | null> => {
		return await dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getById(
			command.id,
			{ fields: command.fields },
		);
	};
};