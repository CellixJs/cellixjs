import type { ModelsContext } from '../../../index.ts';
import { ServicePersistence } from './service/index.ts';
import type { Passport } from '@ocom/domain/contexts/passport';

export const ServiceContextPersistence = (models: ModelsContext, passport: Passport) => ({
    Service: ServicePersistence(models, passport)
});