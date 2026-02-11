import { Domain, type DomainDataSource } from '@ocom/domain';
import type { ServiceQueueStorage } from '@ocom/service-queue-storage';

const { EventBusInstance, CommunityCreatedEvent } = Domain.Events;

export default (
	domainDataSource: DomainDataSource,
	queueService: ServiceQueueStorage,
) => {
	EventBusInstance.register(CommunityCreatedEvent, async (payload) => {
		const { communityId } = payload;
		
		// Load the community to get additional details
		const community = await Domain.Services.Community.CommunityService.getCommunityById(
			communityId,
			domainDataSource,
		);
		
		if (!community) {
			console.error(`Community not found for queue message: ${communityId}`);
			return;
		}
		
		// Send message to queue
		try {
			await queueService.communitySender.sendMessage({
				communityId,
				name: community.name,
				createdAt: community.createdAt.toISOString(),
			});
			console.log(`Sent community-created message to queue: ${communityId}`);
		} catch (error) {
			console.error('Failed to send community-created message to queue:', error);
			// Don't throw - we don't want queue failures to break the event handler
		}
	});
};
