import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getServiceUnitOfWork } from './service.uow.ts';

export type ServiceReturnType = {
    ServiceUnitOfWork: Domain.Contexts.Service.Service.ServiceUnitOfWork;
};

export type ServicePersistenceType = (
	models: ModelsContext,
	passport: Domain.Passport,
) => ServiceReturnType;

export const ServicePersistence: ServicePersistenceType = (models: ModelsContext, passport: Domain.Passport) => {
	const ServiceModel = models.Service;
	return {
		ServiceUnitOfWork: getServiceUnitOfWork(ServiceModel, passport),
	};
};