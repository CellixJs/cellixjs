import type { Passport } from '@ocom/domain';
import type { ModelsContext } from '../../../index.ts';
import { ServicePersistence } from './service/index.ts';

import { Service } from '@ocom/domain/contexts/service/service';
export const ServiceContextPersistence = (models: ModelsContext, passport: Passport) => ({
    Service: ServicePersistence(models, passport)
});