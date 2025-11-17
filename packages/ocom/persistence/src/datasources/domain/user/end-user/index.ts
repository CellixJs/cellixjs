import type { ModelsContext } from '../../../../index.ts';
import { getEndUserUnitOfWork } from './end-user.uow.ts';
import type { Passport } from '@ocom/domain/contexts/passport';

export const EndUserPersistence = (models: ModelsContext, passport: Passport) => {
	const EndUserModel = models.User?.EndUser;
	return {
		EndUserUnitOfWork: getEndUserUnitOfWork(EndUserModel, passport),
	};
};
