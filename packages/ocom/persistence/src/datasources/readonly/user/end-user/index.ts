import type { Domain } from '@ocom/domain';
import type { ModelsContext, PersistenceFactory } from '../../../../types.ts';
import { type EndUserReadRepository, getEndUserReadRepository } from './end-user.read-repository.ts';

export type { EndUserReadRepository } from './end-user.read-repository.ts';

export type EndUserReadReturnType = {
    EndUserReadRepo: EndUserReadRepository;
};

export type EndUserReadRepositoryImplType = PersistenceFactory<EndUserReadReturnType>;

export const EndUserReadRepositoryImpl: EndUserReadRepositoryImplType = (models: ModelsContext, passport: Domain.Passport) => {
    return {
        EndUserReadRepo: getEndUserReadRepository(models, passport),
    };
};
