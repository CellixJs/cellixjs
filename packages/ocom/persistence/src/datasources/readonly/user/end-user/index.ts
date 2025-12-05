import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { type EndUserReadRepository, getEndUserReadRepository } from './end-user.read-repository.ts';

export type { EndUserReadRepository } from './end-user.read-repository.ts';

export type EndUserReadReturnType = {
    EndUserReadRepo: EndUserReadRepository;
};

export type EndUserReadRepositoryImplType = (
    models: ModelsContext,
    passport: Domain.Passport
) => EndUserReadReturnType;

export const EndUserReadRepositoryImpl: EndUserReadRepositoryImplType = (models: ModelsContext, passport: Domain.Passport) => {
    return {
        EndUserReadRepo: getEndUserReadRepository(models, passport),
    };
};
