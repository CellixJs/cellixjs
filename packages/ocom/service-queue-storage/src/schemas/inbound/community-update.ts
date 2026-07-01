import { defineQueue } from '@cellix/service-queue-storage';
import { type Schema as CommunityUpdatePayload, schema as communityUpdateSchema } from './community-update.schema.generated.ts';

export type { CommunityUpdatePayload };

export const communityUpdateQueueName = 'community-update' as const;

export const communityUpdateQueue = defineQueue<CommunityUpdatePayload>()(({ $payload }) => ({
	queueName: communityUpdateQueueName,
	schema: communityUpdateSchema,
	loggingTags: {
		domain: 'community',
		communityId: $payload.communityId,
	},
	loggingMetadata: {
		updateType: 'community-settings',
	},
}));
