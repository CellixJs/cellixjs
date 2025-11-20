import type { DomainDataSource} from '@ocom/domain';
import { EventBusInstance, CommunityCreatedEvent } from '@ocom/domain/events';
import { Community } from '@ocom/domain/services';

export default (
    domainDataSource: DomainDataSource
) => {
    EventBusInstance.register(CommunityCreatedEvent, async (payload) => {
        const { communityId } = payload;
        return await Community.CommunityProvisioningService.provisionMemberAndDefaultRole(
            communityId,
            domainDataSource
        );
    });
}