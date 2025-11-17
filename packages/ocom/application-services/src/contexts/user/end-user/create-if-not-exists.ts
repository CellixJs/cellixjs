import type { DataSources } from '@ocom/persistence';
import type * as EndUser from '@ocom/domain/contexts/end-user';

export interface EndUserCreateCommand {
    externalId: string;
    lastName: string;
    restOfName?: string | undefined;
    email: string;
}

export const createIfNotExists = (
    dataSources: DataSources
) => {
    return async (
        command: EndUserCreateCommand,
    ): Promise<EndUser.EndUserEntityReference> => {
        const existingEndUser = await dataSources.readonlyDataSource.User.EndUser.EndUserReadRepo.getByExternalId(command.externalId);
        if (existingEndUser) {
            return existingEndUser;
        }
        let endUserToReturn: EndUser.EndUserEntityReference | undefined;
        await dataSources.domainDataSource.User.EndUser.EndUserUnitOfWork.withScopedTransaction(
            async (repo) => {
                const newEndUser = await repo.getNewInstance(command.externalId, command.lastName, command.restOfName, command.email);
                endUserToReturn = await repo.save(newEndUser);
            },
        );
        if (!endUserToReturn) { throw new Error('end user not found'); }
        return endUserToReturn;
    };
};
