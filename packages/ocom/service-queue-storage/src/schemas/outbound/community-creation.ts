import { defineQueue } from '@cellix/service-queue-storage';
import { type Schema as CommunityCreationPayload, schema as communityCreationSchema } from './community-creation.schema.generated.ts';

export type { CommunityCreationPayload };

export const communityCreationQueue = defineQueue<CommunityCreationPayload>()(({ $payload }) => ({
	queueName: 'community-creation',
	schema: communityCreationSchema,
	loggingTags: { domain: 'community', type: 'creation' },
	loggingMetadata: { communityId: $payload.communityId, createdBy: $payload.createdBy },
}));
