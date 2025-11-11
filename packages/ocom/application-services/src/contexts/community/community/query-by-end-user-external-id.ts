import type { CommunityEntityReference } from '@ocom/domain/contexts/community/community';
import type { DataSources } from '@ocom/persistence';

export interface CommunityQueryByEndUserExternalIdCommand {
	externalId: string;
	fields?: string[];
}

export const queryByEndUserExternalId = (dataSources: DataSources) => {
	return async (
		command: CommunityQueryByEndUserExternalIdCommand,
	): Promise<CommunityEntityReference[]> => {
		return await dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getByEndUserExternalId(
			command.externalId,
		);
	};
};