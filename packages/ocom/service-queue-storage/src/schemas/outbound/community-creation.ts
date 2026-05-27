import type { QueueDefinition } from '@cellix/service-queue-storage';
import schema from './community-creation.schema.json' with { type: 'json' };

export interface CommunityCreationMessage {
	communityId: string;
	name: string;
	createdBy: string;
}

export const communityCreationQueue: QueueDefinition<CommunityCreationMessage> = {
	queueName: 'community-creation',
	schema,
	loggingTags: { domain: 'community', type: 'creation' },
	loggingMetadata: { communityId: { payloadField: 'communityId' } },
};
