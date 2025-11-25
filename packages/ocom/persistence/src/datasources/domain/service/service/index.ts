import type { Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getServiceUnitOfWork } from './service.uow.ts';

export const ServicePersistence = (models: ModelsContext, passport: Passport) => {
	const ServiceModel = models.Service;
	return {
		ServiceUnitOfWork: getServiceUnitOfWork(ServiceModel, passport),
	};
};