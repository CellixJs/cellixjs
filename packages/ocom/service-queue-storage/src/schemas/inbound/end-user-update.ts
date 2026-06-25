import { defineQueue } from '@cellix/service-queue-storage';
import { schema as endUserUpdateSchema, type Schema as EndUserUpdatePayload } from './end-user-update.schema.generated.ts';

export type { EndUserUpdatePayload };

export const endUserUpdateQueue = defineQueue<EndUserUpdatePayload>()(({ $payload }) => ({
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
