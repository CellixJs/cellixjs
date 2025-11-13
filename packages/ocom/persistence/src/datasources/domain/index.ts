import type { Domain, DomainDataSource } from '@ocom/domain';
import type { ModelsContext } from '../../index.ts';
import { CaseContextPersistence } from './case/index.ts';
import { CommunityContextPersistence } from './community/index.ts';
import { PropertyContextPersistence } from './property/index.ts';
import { ServiceContextPersistence } from './service/index.ts';
import { UserContextPersistence } from './user/index.ts';

import { Community } from '@ocom/domain/contexts/community/community';
import { Property } from '@ocom/domain/contexts/property/property';
import { Service } from '@ocom/domain/contexts/service/service';
export const DomainDataSourceImplementation = (models: ModelsContext, passport: Passport): DomainDataSource => ({
    Case: CaseContextPersistence(models, passport),
    Community: CommunityContextPersistence(models, passport),
    Property: PropertyContextPersistence(models, passport),
    User: UserContextPersistence(models, passport),
    Service: ServiceContextPersistence(models, passport)
});