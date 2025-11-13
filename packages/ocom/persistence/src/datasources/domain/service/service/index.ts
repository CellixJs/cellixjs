import type { Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { getServiceUnitOfWork } from './service.uow.ts';

import { Service } from '@ocom/domain/contexts/service/service';
export const ServicePersistence = (models: ModelsContext, passport: Passport) => {
	const ServiceModel = models.Service.Service;
	return {
		ServiceUnitOfWork: getServiceUnitOfWork(ServiceModel, passport),
	};
};