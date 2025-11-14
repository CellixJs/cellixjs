import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

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
    ): Promise<Domain.EndUser.EndUserEntityReference> => {
        const existingEndUser = await dataSources.readonlyDataSource.User.EndUser.EndUserReadRepo.getByExternalId(command.externalId);
        if (existingEndUser) {
            return existingEndUser;
        }
        let endUserToReturn: Domain.EndUser.EndUserEntityReference | undefined;
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
