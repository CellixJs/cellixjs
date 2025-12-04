import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getEndUserUnitOfWork } from './end-user.uow.ts';

export type EndUserReturnType = {
    EndUserUnitOfWork: Domain.Contexts.User.EndUser.EndUserUnitOfWork;
};

export type EndUserPersistenceType = (
    models: ModelsContext,
    passport: Domain.Passport,
) => EndUserReturnType;

export const EndUserPersistence: EndUserPersistenceType = (models: ModelsContext, passport: Domain.Passport) => {
	const EndUserModel = models.EndUser;
	return {
		EndUserUnitOfWork: getEndUserUnitOfWork(EndUserModel, passport),
	};
};
