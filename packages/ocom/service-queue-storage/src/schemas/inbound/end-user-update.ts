import { defineQueue } from '@cellix/service-queue-storage';
import schema from './end-user-update.schema.json' with { type: 'json' };

export interface EndUserUpdateMessage {
	externalId: string;
	email?: string;
	displayName?: string;
	lastName?: string;
	restOfName?: string;
	legalNameConsistsOfOneName?: boolean;
}

export const endUserUpdateQueue = defineQueue<EndUserUpdateMessage>()(({ $payload }) => ({
	queueName: 'end-user-update',
	schema,
	loggingTags: {
		domain: 'user',
		externalId: $payload.externalId,
	},
	loggingMetadata: {
		updateType: 'external-sync',
		email: $payload.email,
	},
}));
