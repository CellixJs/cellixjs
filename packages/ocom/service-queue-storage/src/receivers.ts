/**
 * Queue Receivers
 * 
 * Concrete implementations of queue receivers for Owner Community
 */

import {
	BaseQueueReceiver,
	type BaseQueueReceiverConfig,
} from '@cellix/queue-storage-seedwork/base-queue-receiver';
import {
	memberUpdateSchema,
	type MemberUpdatePayload,
} from './queue-configs.ts';

/**
 * Receiver for member update inbound queue
 */
export class MemberQueueReceiver extends BaseQueueReceiver<MemberUpdatePayload> {
	constructor(config: BaseQueueReceiverConfig) {
		super(config, {
			queueName: 'member',
			direction: 'inbound',
			payloadSchema: memberUpdateSchema,
			blobLogging: {
				metadata: { source: 'external-system' },
				tags: { type: 'member-update', entity: 'member' },
			},
		});
	}
}
