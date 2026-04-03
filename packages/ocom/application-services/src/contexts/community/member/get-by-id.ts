import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface MemberGetByIdCommand {
	id: string;
}

export const getById = (dataSources: DataSources) => {
	return async (command: MemberGetByIdCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference | null> => {
		return await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getById(command.id);
	};
};
