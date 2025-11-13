import type { Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getEndUserUnitOfWork } from './end-user.uow.ts';

import { EndUser } from '@ocom/domain/contexts/user/end-user';
export const EndUserPersistence = (models: ModelsContext, passport: Passport) => {
	const EndUserModel = models.User?.EndUser;
	return {
		EndUserUnitOfWork: getEndUserUnitOfWork(EndUserModel, passport),
	};
};
