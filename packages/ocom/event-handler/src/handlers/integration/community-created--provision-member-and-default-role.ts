import {
	EventBusInstance,
	CommunityCreatedEvent,
	CommunityProvisioningService,
	type DomainDataSource,
} from '@ocom/domain';

const communityProvisioningService = new CommunityProvisioningService();

export default (domainDataSource: DomainDataSource) => {
	EventBusInstance.register(
		CommunityCreatedEvent,
		async (payload: { communityId: string }) => {
			const { communityId } = payload;
			return await communityProvisioningService.provisionMemberAndDefaultRole(
				communityId,
				domainDataSource,
			);
		},
	);
};