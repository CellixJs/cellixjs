import type { Domain, DomainDataSource } from '@ocom/api-domain';
import type { ModelsContext } from '../../index.ts';
import { CommunityContextPersistence } from './community/index.ts';
import { UserContextPersistence } from './user/index.ts';

export const DomainDataSourceImplementation = (models: ModelsContext, passport: Domain.Passport): DomainDataSource => ({
    Community: CommunityContextPersistence(models, passport),
    User: UserContextPersistence(models, passport)
});