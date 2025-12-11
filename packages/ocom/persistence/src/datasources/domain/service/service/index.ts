import type { Domain } from '@ocom/domain';
import type { ModelsContext, PersistenceFactory } from '../../../../types.ts';
import { getServiceUnitOfWork } from './service.uow.ts';

export type ServiceReturnType = {
    ServiceUnitOfWork: Domain.Contexts.Service.Service.ServiceUnitOfWork;
};

export const ServicePersistence: PersistenceFactory<ServiceReturnType> = (models: ModelsContext, passport: Domain.Passport) => {
	const ServiceModel = models.Service;
	return {
		ServiceUnitOfWork: getServiceUnitOfWork(ServiceModel, passport),
	};
};