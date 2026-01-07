import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface MemberQueryByIdCommand {
    id: string;
    fields?: string[];
};

export const queryById = (
    dataSources: DataSources,
) => {
    return async (
        command: MemberQueryByIdCommand,
    ): Promise<Domain.Contexts.Community.Member.MemberEntityReference | null> => {
        return await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getById(
            command.id,
        )
    }
}
