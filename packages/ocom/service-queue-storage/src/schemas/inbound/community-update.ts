import { defineQueue } from '@cellix/service-queue-storage';
import schema from './community-update.schema.json' with { type: 'json' };

export interface CommunityUpdateMessage {
	communityId: string;
	name?: string;
	domain?: string;
	whiteLabelDomain?: string | null;
	handle?: string | null;
}

export const communityUpdateQueue = defineQueue<CommunityUpdateMessage>()(({ $payload }) => ({
	queueName: 'community-update',
	schema,
	loggingTags: {
		domain: 'community',
		communityId: $payload.communityId,
	},
	loggingMetadata: {
		updateType: 'settings',
	},
}));
