import type { DomainDataSource} from '@ocom/domain';
import { EventBusInstance } from '@ocom/domain/events';
import { CommunityCreatedEvent } from '@ocom/domain/events/types';
import { CommunityProvisioningService } from '@ocom/domain/services/community';

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