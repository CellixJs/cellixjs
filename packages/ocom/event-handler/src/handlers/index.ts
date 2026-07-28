import { Domain, type DomainDataSource } from '@ocom/domain';
import { RegisterDomainEventHandlers } from './domain/index.ts';
import { RegisterIntegrationEventHandlers } from './integration/index.ts';

export const RegisterEventHandlers = (domainDataSource: DomainDataSource) => {
	RegisterDomainEventHandlers(domainDataSource);
	RegisterIntegrationEventHandlers(domainDataSource);
};

export const RecoverDeletedStaffRoles = async (domainDataSource: DomainDataSource): Promise<number> => {
	return await Domain.Services.User.StaffRoleDeletionRecoveryService.retryDeletedStaffRoles(domainDataSource);
};
