import type { Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { EndUserReadRepositoryImpl } from './end-user/index.ts';

export const UserContext = (models: ModelsContext, passport: Passport) => ({
    EndUser: EndUserReadRepositoryImpl(models, passport),
});
