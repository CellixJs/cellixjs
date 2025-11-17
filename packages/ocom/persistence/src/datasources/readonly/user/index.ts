import type { ModelsContext } from '../../../index.ts';
import { EndUserReadRepositoryImpl } from './end-user/index.ts';
import type { Passport } from '@ocom/domain/contexts/passport';

export const UserContext = (models: ModelsContext, passport: Passport) => ({
    EndUser: EndUserReadRepositoryImpl(models, passport),
});
