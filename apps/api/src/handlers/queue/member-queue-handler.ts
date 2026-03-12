/**
 * Member Queue Handler
 * 
 * Azure Function queue trigger that processes member update messages.
 */

import type { InvocationContext } from '@azure/functions';
import type { ApplicationServices } from '@ocom/application-services';
import { ServiceQueueStorage } from '@ocom/service-queue-storage';

/**
 * Creates the member queue handler
 */
export const memberQueueHandlerCreator = (
appHost: { forRequest(): Promise<ApplicationServices> },
infraRegistry: { getInfrastructureService<T>(key: new (...args: unknown[]) => T): T },
) => {
return async (queueEntry: unknown, context: InvocationContext) => {
context.log('Processing member queue message:', queueEntry);

try {
// Get the queue service
const queueService = infraRegistry.getInfrastructureService(ServiceQueueStorage);

// Receive and process the message
const messages = await queueService.memberReceiver.receiveMessages({
maxMessages: 1,
visibilityTimeout: 60,
});

if (messages.length === 0) {
context.log('No messages to process');
return;
}

const { message, messageId, popReceipt } = messages[0];
const { memberId, updates } = message.payload;

context.log(`Processing member update for: ${memberId}`, updates);

// Get application services
const app = await appHost.forRequest();

// Update the member
await app.Members.updateMember(memberId, updates);

context.log(`Successfully updated member: ${memberId}`);

// Delete the message from the queue
await queueService.memberReceiver.deleteMessage(messageId, popReceipt);

context.log(`Deleted message from queue: ${messageId}`);
} catch (error) {
context.error('Error processing member queue message:', error);
throw error;
}
};
};
