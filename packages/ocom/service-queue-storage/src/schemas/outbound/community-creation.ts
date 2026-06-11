import { defineQueue } from '@cellix/service-queue-storage';
import schema from './community-creation.schema.json' with { type: 'json' };

export interface CommunityCreationMessage {
	communityId: string;
	name: string;
	createdBy: string;
}

export const communityCreationQueue = defineQueue<CommunityCreationMessage>()(({ $payload }) => ({
	queueName: 'community-creation',
	schema,
	loggingTags: { domain: 'community', type: 'creation' },
	loggingMetadata: { communityId: $payload.communityId, createdBy: $payload.createdBy },
}));
