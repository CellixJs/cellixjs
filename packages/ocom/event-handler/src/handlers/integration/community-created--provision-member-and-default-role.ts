import type { DomainDataSource } from '@ocom/domain';
import { EventBusInstance, CommunityCreatedEvent } from '@ocom/domain/events';
import { CommunityProvisioningService } from '@ocom/domain/services';

export default (
    domainDataSource: DomainDataSource
) => {
    EventBusInstance.register(CommunityCreatedEvent, async (payload) => {
        const { communityId } = payload;
        return await CommunityProvisioningService.provisionMemberAndDefaultRole(
            communityId,
            domainDataSource
        );
    });
}