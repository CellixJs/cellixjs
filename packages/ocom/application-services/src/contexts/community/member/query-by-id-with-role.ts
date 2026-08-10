import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface MemberQueryByIdWithRoleCommand {
	id: string;
}

export const queryByIdWithRole = (dataSources: DataSources) => {
	return async (command: MemberQueryByIdWithRoleCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference | null> => {
		return await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getByIdWithRole(command.id);
	};
};
