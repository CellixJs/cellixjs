import type { DataSources } from '@ocom/persistence';
import type { EndUserEntityReference, EndUserUnitOfWork } from '@ocom/domain/contexts/end-user';

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
    ): Promise<EndUserEntityReference> => {
        const existingEndUser = await dataSources.readonlyDataSource.User.EndUser.EndUserReadRepo.getByExternalId(command.externalId);
        if (existingEndUser) {
            return existingEndUser;
        }
        let endUserToReturn: EndUserEntityReference | undefined;
        await dataSources.domainDataSource.User.EndUserUnitOfWork.withScopedTransaction(
            async (repo) => {
                const newEndUser = await repo.getNewInstance(command.externalId, command.lastName, command.restOfName, command.email);
                endUserToReturn = await repo.save(newEndUser);
            },
        );
        if (!endUserToReturn) { throw new Error('end user not found'); }
        return endUserToReturn;
    };
};
