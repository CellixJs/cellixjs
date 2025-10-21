import type { Domain, DomainDataSource } from '@ocom/domain';
import type { ModelsContext } from '../../index.ts';
import { CommunityContextPersistence } from './community/index.ts';
import { PropertyContextPersistence } from './property/index.ts';
import { UserContextPersistence } from './user/index.ts';
import { ServiceContextPersistence } from './service/index.ts';

export const DomainDataSourceImplementation = (models: ModelsContext, passport: Domain.Passport): DomainDataSource => ({
    Community: CommunityContextPersistence(models, passport),
    Property: PropertyContextPersistence(models, passport),
    User: UserContextPersistence(models, passport),
    Service: ServiceContextPersistence(models, passport)
});