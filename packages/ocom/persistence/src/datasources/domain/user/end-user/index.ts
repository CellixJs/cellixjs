import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getEndUserUnitOfWork } from './end-user.uow.ts';

export const EndUserPersistence = (models: ModelsContext, passport: Domain.Passport) => {
	const EndUserModel = models.User?.EndUser;
	return {
		EndUserUnitOfWork: getEndUserUnitOfWork(EndUserModel, passport),
	};
};
