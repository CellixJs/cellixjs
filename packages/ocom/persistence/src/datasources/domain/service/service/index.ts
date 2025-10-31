import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getServiceUnitOfWork } from './service.uow.ts';

export const ServicePersistence = (models: ModelsContext, passport: Domain.Passport) => {
	const ServiceModel = models.Service.Service;
	return {
		ServiceUnitOfWork: getServiceUnitOfWork(ServiceModel, passport),
	};
};