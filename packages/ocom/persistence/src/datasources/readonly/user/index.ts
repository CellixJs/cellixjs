import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { type EndUserReadRepository, EndUserReadRepositoryImpl } from './end-user/index.ts';

type UserContextType = (
    models: ModelsContext,
    passport: Domain.Passport,
) => {
    EndUser: { EndUserReadRepo: EndUserReadRepository };
};

export const UserContext: UserContextType = (models: ModelsContext, passport: Domain.Passport) => ({
    EndUser: EndUserReadRepositoryImpl(models, passport),
});
