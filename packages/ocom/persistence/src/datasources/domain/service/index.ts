import type { DomainDataSource, Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { ServicePersistence } from './service/index.ts';

export const ServiceContextPersistence = (models: ModelsContext, passport: Passport) => ({
    Service: ServicePersistence(models, passport)
});