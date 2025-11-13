import type { Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { EndUserReadRepositoryImpl } from './end-user/index.ts';

import { EndUser } from '@ocom/domain/contexts/user/end-user';
export const UserContext = (models: ModelsContext, passport: Passport) => ({
    EndUser: EndUserReadRepositoryImpl(models, passport),
});
