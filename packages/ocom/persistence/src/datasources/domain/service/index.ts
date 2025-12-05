import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { type ServiceReturnType, ServicePersistence } from './service/index.ts';

interface ServiceContextPersistence {
    Service: ServiceReturnType;
}

type ServiceContextPersistenceType = (
    models: ModelsContext,
    passport: Domain.Passport,
) => ServiceContextPersistence;

export const ServiceContextPersistence: ServiceContextPersistenceType = (models: ModelsContext, passport: Domain.Passport) => ({
    Service: ServicePersistence(models, passport)
});