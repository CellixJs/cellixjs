import type { DomainDataSource, Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getEndUserUnitOfWork } from './end-user.uow.ts';

export const EndUserPersistence = (models: ModelsContext, passport: Passport) => {
	const EndUserModel = models.EndUser;
	return {
		EndUserUnitOfWork: getEndUserUnitOfWork(EndUserModel, passport),
	};
};
