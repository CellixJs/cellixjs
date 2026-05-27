import type { QueueDefinition } from '@cellix/service-queue-storage';
import schema from './end-user-update.schema.json' with { type: 'json' };

export interface EndUserUpdateMessage {
	externalId: string;
	email?: string;
	displayName?: string;
	lastName?: string;
	restOfName?: string;
	legalNameConsistsOfOneName?: boolean;
}

export const endUserUpdateQueue: QueueDefinition<EndUserUpdateMessage> = {
	queueName: 'end-user-update',
	schema,
	loggingTags: {
		domain: 'user',
		externalId: { payloadField: 'externalId' }, // Extracted from message.externalId at runtime
	},
	loggingMetadata: {
		updateType: 'external-sync',
		email: { payloadField: 'email' }, // Extracted from message.email (omitted if undefined)
	},
};
