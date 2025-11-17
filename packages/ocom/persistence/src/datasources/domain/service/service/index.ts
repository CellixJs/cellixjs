import type { ModelsContext } from '../../../../index.ts';
import { getServiceUnitOfWork } from './service.uow.ts';
import type { Passport } from '@ocom/domain/contexts/passport';

export const ServicePersistence = (models: ModelsContext, passport: Passport) => {
	const ServiceModel = models.Service.Service;
	return {
		ServiceUnitOfWork: getServiceUnitOfWork(ServiceModel, passport),
	};
};