import type { Domain } from '@ocom/domain';
import type { ModelsContext, PersistenceFactory } from '../../../types.ts';
import { type ServiceReturnType, ServicePersistence } from './service/index.ts';

export interface ServiceContextPersistence {
    Service: ServiceReturnType;
}

export const ServiceContextPersistence: PersistenceFactory<ServiceContextPersistence> = (models: ModelsContext, passport: Domain.Passport) => ({
    Service: ServicePersistence(models, passport)
});