import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface EndUserQueryByCommunityIdCommand {
	communityId: string;
	fields?: string[];
}

export const queryByCommunityId = (dataSources: DataSources) => {
	return async (command: EndUserQueryByCommunityIdCommand): Promise<Domain.Contexts.User.EndUser.EndUserEntityReference[]> => {
		const members = await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getByCommunityId(command.communityId);
		const uniqueEndUserIds = [...new Set(members.flatMap((member) => member.accounts.map((account) => account.user.id)).filter(Boolean))];

		const endUserRepo = dataSources.readonlyDataSource.User.EndUser.EndUserReadRepo;

		let endUsers: Array<Domain.Contexts.User.EndUser.EndUserEntityReference | null> = [];

		type EndUserRepoWithBulk = {
			getByIds?: (ids: string[], options?: { fields?: string[] }) => Promise<Array<Domain.Contexts.User.EndUser.EndUserEntityReference | null>>;
		};
		const endUserRepoWithBulk = endUserRepo as unknown as EndUserRepoWithBulk;
		const options = command.fields ? { fields: command.fields } : undefined;
		if (typeof endUserRepoWithBulk.getByIds === 'function') {
			endUsers = await endUserRepoWithBulk.getByIds(uniqueEndUserIds, options);
		} else {
			endUsers = await Promise.all(uniqueEndUserIds.map(async (endUserId) => await endUserRepo.getById(endUserId, options)));
		}

		return endUsers.filter((endUser): endUser is Domain.Contexts.User.EndUser.EndUserEntityReference => endUser !== null);
	};
};
