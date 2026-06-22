import { defineQueue } from '@cellix/service-queue-storage';
import { schema as endUserUpdateSchema, type Schema as EndUserUpdateMessage } from './end-user-update.schema.generated.ts';

export type { EndUserUpdateMessage };

export const endUserUpdateQueue = defineQueue<EndUserUpdateMessage>()(({ $payload }) => ({
	queueName: 'end-user-update',
	schema: endUserUpdateSchema,
	loggingTags: {
		domain: 'user',
		externalId: $payload.externalId,
	},
	loggingMetadata: {
		updateType: 'external-sync',
		email: $payload.email,
	},
}));
