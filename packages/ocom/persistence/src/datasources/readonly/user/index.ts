import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { EndUserReadRepositoryImpl, type EndUserReadRepositoryImplType  } from './end-user/index.ts';

type UserContextType = (
    models: ModelsContext,
    passport: Domain.Passport,
) => {
    EndUser: ReturnType<EndUserReadRepositoryImplType>;
};

export const UserContext: UserContextType = (models: ModelsContext, passport: Domain.Passport) => ({
    EndUser: EndUserReadRepositoryImpl(models, passport),
});
