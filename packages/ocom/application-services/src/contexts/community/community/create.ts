import type { CommunityEntityReference } from '@ocom/domain/community';
import type { DataSources } from '@ocom/persistence';

export interface CommunityCreateCommand {
	name: string;
	endUserExternalId: string;
}

export const create = (
    dataSources: DataSources
) => {
	return async (
		command: CommunityCreateCommand,
	): Promise<CommunityEntityReference> => {
        const createdBy = await dataSources.readonlyDataSource.User.EndUser.EndUserReadRepo.getByExternalId(command.endUserExternalId);
        if (!createdBy) {
            throw new Error(`End user not found for external id ${command.endUserExternalId}`);
        }
        let communityToReturn: CommunityEntityReference | undefined;
		await dataSources.domainDataSource.Community.Community.CommunityUnitOfWork.withScopedTransaction(
			async (repo) => {
                const newCommunity = await repo.getNewInstance(command.name, createdBy);
                communityToReturn = await repo.save(newCommunity);
			},
		);
        if (!communityToReturn) { throw new Error('community not found'); }
        return communityToReturn;
	};
};
