import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { type ServiceReturnType, ServicePersistence } from './service/index.ts';

type ServiceContextPersistenceType = (
    models: ModelsContext,
    passport: Domain.Passport,
) => {
    Service: ServiceReturnType;
};

export const ServiceContextPersistence: ServiceContextPersistenceType = (models: ModelsContext, passport: Domain.Passport) => ({
    Service: ServicePersistence(models, passport)
});