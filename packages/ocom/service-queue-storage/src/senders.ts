/**
 * Queue Senders
 * 
 * Concrete implementations of queue senders for Owner Community
 */

import {
	BaseQueueSender,
	type BaseQueueSenderConfig,
} from '@cellix/queue-storage-seedwork/base-queue-sender';
import {
	communityCreatedSchema,
	type CommunityCreatedPayload,
} from './queue-configs.ts';

/**
 * Sender for community-created outbound queue
 */
export class CommunityCreatedQueueSender extends BaseQueueSender<CommunityCreatedPayload> {
	constructor(config: BaseQueueSenderConfig) {
		super(config, {
			queueName: 'community-created',
			direction: 'outbound',
			payloadSchema: communityCreatedSchema,
			blobLogging: {
				metadata: { source: 'owner-community' },
				tags: { type: 'integration-event', entity: 'community' },
			},
		});
	}
}
