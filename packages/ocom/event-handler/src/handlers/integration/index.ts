import type { DomainDataSource } from '@ocom/domain';
import type { ServiceQueueStorage } from '@ocom/service-queue-storage';
import RegisterCommunityCreatedProvisionMemberAndDefaultRoleHandler from './community-created--provision-member-and-default-role.ts';
import RegisterCommunityCreatedSendQueueMessageHandler from './community-created--send-queue-message.ts';

export const RegisterIntegrationEventHandlers = (
	domainDataSource: DomainDataSource,
	queueService?: ServiceQueueStorage,
): void => {
	RegisterCommunityCreatedProvisionMemberAndDefaultRoleHandler(domainDataSource);
	
	if (queueService) {
		RegisterCommunityCreatedSendQueueMessageHandler(domainDataSource, queueService);
	}
};

