import type { Domain } from '@ocom/api-domain';
import type { ModelsContext } from '../../../index.ts';
import * as EndUser from './end-user/index.ts';

export const UserContextPersistence = (models: ModelsContext, passport: Domain.Passport) => ({
	EndUser: EndUser.EndUserPersistence(models, passport),
});
