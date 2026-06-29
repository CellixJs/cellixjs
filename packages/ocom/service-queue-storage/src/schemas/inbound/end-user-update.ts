import { defineQueue } from '@cellix/service-queue-storage';
import { type Schema as EndUserUpdatePayload, schema as endUserUpdateSchema } from './end-user-update.schema.generated.ts';

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
