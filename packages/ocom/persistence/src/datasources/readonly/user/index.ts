import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { EndUserReadRepositoryImpl, type EndUserReadRepositoryImplType  } from './end-user/index.ts';

interface UserContext {
    EndUser: ReturnType<EndUserReadRepositoryImplType>;
}

type UserContextType = (
    models: ModelsContext,
    passport: Domain.Passport,
) => UserContext;

export const UserContext: UserContextType = (models: ModelsContext, passport: Domain.Passport) => ({
    EndUser: EndUserReadRepositoryImpl(models, passport),
});
