import type { DataSources } from '@ocom/api-persistence';

export interface MemberDetermineIfAdminCommand {
    memberId: string;
};

export const determineIfAdmin = (
    dataSources: DataSources,
) => {
    return async (
        command: MemberDetermineIfAdminCommand,
    ): Promise<boolean> => {
        return await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.isAdmin(
            command.memberId,
        )
    }
}