import type { DomainDataSource} from '@ocom/domain';
import { EventBusInstance } from '@ocom/domain/events/event-bus';
import type { CommunityCreatedEvent } from '@ocom/domain/events/types/community-created';
import { CommunityProvisioningServiceInstance } from '@ocom/domain/services/community-provisioning';

export default (
    domainDataSource: DomainDataSource
) => {
    EventBusInstance.register(CommunityCreatedEvent, async (payload) => {
        const { communityId } = payload;
        return await CommunityProvisioningServiceInstance.provisionMemberAndDefaultRole(
            communityId,
            domainDataSource
        );
    });
}