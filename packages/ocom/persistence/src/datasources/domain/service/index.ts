import type { Domain } from '@ocom/domain';
import type { ModelsContext, PersistenceFactory } from '../../../types.ts';
import { type ServiceReturnType, ServicePersistence } from './service/index.ts';

interface ServiceContextPersistence {
    Service: ServiceReturnType;
}

type ServiceContextPersistenceType = PersistenceFactory<ServiceContextPersistence>;

export const ServiceContextPersistence: ServiceContextPersistenceType = (models: ModelsContext, passport: Domain.Passport) => ({
    Service: ServicePersistence(models, passport)
});