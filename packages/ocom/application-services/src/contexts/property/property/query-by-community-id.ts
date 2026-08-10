import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface PropertyQueryByCommunityIdCommand {
	communityId: string;
}

export const queryByCommunityId = (dataSources: DataSources) => {
	return async (command: PropertyQueryByCommunityIdCommand): Promise<Domain.Contexts.Property.Property.PropertyEntityReference[]> => {
		return await dataSources.readonlyDataSource.Property.Property.PropertyReadRepo.getByCommunityId(command.communityId);
	};
};
