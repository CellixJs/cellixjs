/**
 * Queue Storage Service
 * 
 * Owner Community infrastructure service for Azure Queue Storage operations.
 * Manages queue senders and receivers with automatic blob logging.
 */

import type { ServiceBase } from '@cellix/api-services-spec';
import { MessageLogger } from '@cellix/queue-storage-seedwork/message-logger';
import { SchemaValidator } from '@cellix/queue-storage-seedwork/schema-validator';
import { CommunityCreatedQueueSender } from './senders.ts';
import { MemberQueueReceiver } from './receivers.ts';

/**
 * Service interface exposing queue operations
 */
export interface QueueStorage {
	/**
	 * Sender for community-created events
	 */
	communitySender: CommunityCreatedQueueSender;
	
	/**
	 * Receiver for member update messages
	 */
	memberReceiver: MemberQueueReceiver;
}

/**
 * Queue Storage infrastructure service
 */
export class ServiceQueueStorage implements ServiceBase<QueueStorage> {
	private readonly connectionString: string;
	private messageLogger: MessageLogger | undefined;
	private schemaValidator: SchemaValidator | undefined;
	private communitySenderInternal: CommunityCreatedQueueSender | undefined;
	private memberReceiverInternal: MemberQueueReceiver | undefined;
	
	constructor(connectionString: string) {
		if (!connectionString || connectionString.trim() === '') {
			throw new Error('Azure Storage connection string is required');
		}
		this.connectionString = connectionString;
	}
	
	async startUp(): Promise<QueueStorage> {
		// Initialize shared dependencies
		this.messageLogger = new MessageLogger({
			connectionString: this.connectionString,
		});
		
		this.schemaValidator = new SchemaValidator();
		
		const baseConfig = {
			connectionString: this.connectionString,
			messageLogger: this.messageLogger,
			schemaValidator: this.schemaValidator,
		};
		
		// Initialize senders
		this.communitySenderInternal = new CommunityCreatedQueueSender(baseConfig);
		await this.communitySenderInternal.ensureQueue();
		
		// Initialize receivers
		this.memberReceiverInternal = new MemberQueueReceiver(baseConfig);
		await this.memberReceiverInternal.ensureQueue();
		
		console.log('ServiceQueueStorage started - queues initialized');
		
		return this;
	}
	
	shutDown(): Promise<void> {
		// No active connections to close for queue storage
		// Queues remain in Azure Storage
		console.log('ServiceQueueStorage stopped');
		return Promise.resolve();
	}
	
	/**
	 * Get the community-created queue sender
	 */
	get communitySender(): CommunityCreatedQueueSender {
		if (!this.communitySenderInternal) {
			throw new Error('ServiceQueueStorage not started - call startUp() first');
		}
		return this.communitySenderInternal;
	}
	
	/**
	 * Get the member update queue receiver
	 */
	get memberReceiver(): MemberQueueReceiver {
		if (!this.memberReceiverInternal) {
			throw new Error('ServiceQueueStorage not started - call startUp() first');
		}
		return this.memberReceiverInternal;
	}
}
