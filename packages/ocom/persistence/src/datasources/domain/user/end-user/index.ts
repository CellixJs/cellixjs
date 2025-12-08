import type { Domain } from '@ocom/domain';
import type { ModelsContext, PersistenceFactory } from '../../../../types.ts';
import { getEndUserUnitOfWork } from './end-user.uow.ts';

export type EndUserReturnType = {
    EndUserUnitOfWork: Domain.Contexts.User.EndUser.EndUserUnitOfWork;
};

export const EndUserPersistence: PersistenceFactory<EndUserReturnType> = (models: ModelsContext, passport: Domain.Passport) => {
	const EndUserModel = models.EndUser;
	return {
		EndUserUnitOfWork: getEndUserUnitOfWork(EndUserModel, passport),
	};
};
