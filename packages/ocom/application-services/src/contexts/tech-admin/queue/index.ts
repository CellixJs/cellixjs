import type { DataSources } from '@ocom/persistence';
import type { QueueStorageOperations } from '@ocom/service-queue-storage';
import { type GetQueueMessageCountCommand, getQueueMessageCount, type TechAdminQueueMessageCount } from './get-queue-message-count.ts';
import { listQueues } from './list-queues.ts';
import { type PeekQueueMessagesCommand, peekMessages } from './peek-messages.ts';
import type { TechAdminQueue as TechAdminQueueListItem, TechAdminQueueMessage } from './queue-list.ts';
import { checkCanSendQueueMessages, checkCanViewQueues, checkPermissionOnce } from './queue-permissions.ts';
import { type SendQueueMessageCommand, sendMessage } from './send-message.ts';

export interface TechAdminQueueApplicationService {
	listQueues: () => Promise<TechAdminQueueListItem[]>;
	getMessageCount: (command: GetQueueMessageCountCommand) => Promise<TechAdminQueueMessageCount>;
	sendMessage: (command: SendQueueMessageCommand) => Promise<void>;
	peekMessages: (command: PeekQueueMessagesCommand) => Promise<TechAdminQueueMessage[]>;
}

export const TechAdminQueue = (dataSources: DataSources, queueStorageService: QueueStorageOperations, staffUserExternalId: string | undefined): TechAdminQueueApplicationService => {
	const checkViewPermission = checkCanViewQueues(dataSources, staffUserExternalId);
	const checkQueueViewPermissionOnce = checkPermissionOnce(checkViewPermission);
	const checkSendPermission = checkCanSendQueueMessages(dataSources, staffUserExternalId);

	return {
		listQueues: listQueues(checkQueueViewPermissionOnce),
		getMessageCount: getQueueMessageCount(queueStorageService, checkQueueViewPermissionOnce),
		sendMessage: sendMessage(queueStorageService, checkSendPermission),
		peekMessages: peekMessages(queueStorageService, checkViewPermission),
	};
};
