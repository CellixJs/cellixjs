import { defineQueue } from '@cellix/service-queue-storage';
import { schema as communityCreationSchema, type Schema as CommunityCreationMessage } from './community-creation.schema.generated.ts';

export type { CommunityCreationMessage };

export const communityCreationQueue = defineQueue<CommunityCreationMessage>()(({ $payload }) => ({
	queueName: 'community-creation',
	schema: communityCreationSchema,
	loggingTags: { domain: 'community', type: 'creation' },
	loggingMetadata: { communityId: $payload.communityId, createdBy: $payload.createdBy },
}));
