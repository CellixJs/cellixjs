import { Domain, type DomainDataSource} from '@ocom/api-domain';

const { EventBusInstance, CommunityCreatedEvent } = Domain.Events;
export default (
    domainDataSource: DomainDataSource
) => {
    EventBusInstance.register(CommunityCreatedEvent, async (payload) => {
        const { communityId } = payload;
        return await Domain.Services.Community.CommunityProvisioningService.provisionMemberAndDefaultRole(
            communityId,
            domainDataSource
        );
    });
}