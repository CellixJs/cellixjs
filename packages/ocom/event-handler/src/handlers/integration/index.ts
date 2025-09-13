import type { DomainDataSource } from '@ocom/domain';
import RegisterCommunityCreatedProvisionMemberAndDefaultRoleHandler from './community-created--provision-member-and-default-role.ts';

export const RegisterIntegrationEventHandlers = (
    domainDataSource: DomainDataSource
): void => {
    RegisterCommunityCreatedProvisionMemberAndDefaultRoleHandler(domainDataSource);
};

