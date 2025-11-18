import type { DomainDataSource} from '@ocom/domain';
import { EventBusInstance, CommunityCreatedEvent } from '@ocom/domain/events';
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