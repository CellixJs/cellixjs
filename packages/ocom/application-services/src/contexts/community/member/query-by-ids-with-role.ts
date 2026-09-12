import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface MemberQueryByIdsWithRoleCommand {
	ids: string[];
}

export const queryByIdsWithRole = (dataSources: DataSources) => {
	return async (command: MemberQueryByIdsWithRoleCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference[]> => {
		return await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getByIdsWithRole(command.ids);
	};
};
