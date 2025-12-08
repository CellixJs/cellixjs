import type { Domain, DomainDataSource } from '@ocom/domain';
import type { ModelsContext, PersistenceFactory } from '../../types.ts';
import { CaseContextPersistence } from './case/index.ts';
import { CommunityContextPersistence } from './community/index.ts';
import { PropertyContextPersistence } from './property/index.ts';
import { ServiceContextPersistence } from './service/index.ts';
import { UserContextPersistence } from './user/index.ts';

type DomainDataSourceImplementationType = PersistenceFactory<DomainDataSource>;

export const DomainDataSourceImplementation: DomainDataSourceImplementationType = (models: ModelsContext, passport: Domain.Passport) => ({
    Case: CaseContextPersistence(models, passport),
    Community: CommunityContextPersistence(models, passport),
    Property: PropertyContextPersistence(models, passport),
    User: UserContextPersistence(models, passport),
    Service: ServiceContextPersistence(models, passport)
});