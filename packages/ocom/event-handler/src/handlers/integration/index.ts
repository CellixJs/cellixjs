import type { DomainDataSource } from '@ocom/domain';
import RegisterCommunityCreatedProvisionMemberAndDefaultRoleHandler from './community-created--provision-member-and-default-role.ts';
import RegisterStaffRoleDeletedReassignStaffUsersHandler from './staff-role-deleted--reassign-staff-users.ts';

export const RegisterIntegrationEventHandlers = (domainDataSource: DomainDataSource): void => {
	RegisterCommunityCreatedProvisionMemberAndDefaultRoleHandler(domainDataSource);
	RegisterStaffRoleDeletedReassignStaffUsersHandler(domainDataSource);
};
