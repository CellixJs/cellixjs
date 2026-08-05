import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { App } from 'antd';
import type React from 'react';
import { useState } from 'react';
import { TechAdminQueueExplorerContainerQueueMessagesDocument, TechAdminQueueExplorerContainerQueuesDocument, TechAdminQueueExplorerContainerSendQueueMessageDocument } from '../generated.tsx';
import { QueueExplorer, type QueueExplorerProps } from './queue-explorer.tsx';

interface QueueExplorerContainerProps {
	canSendQueueMessages: boolean;
}

export const QueueExplorerContainer: React.FC<QueueExplorerContainerProps> = ({ canSendQueueMessages }) => {
	const { message } = App.useApp();
	const [selectedQueue, setSelectedQueue] = useState<string>();
	const {
		data: queueData,
		loading: queueLoading,
		error: queueError,
		refetch: refetchQueues,
	} = useQuery(TechAdminQueueExplorerContainerQueuesDocument, {
		fetchPolicy: 'network-only',
	});
	const [loadMessages, { data: messageData, loading: messageLoading, error: messageError }] = useLazyQuery(TechAdminQueueExplorerContainerQueueMessagesDocument, {
		fetchPolicy: 'network-only',
	});
	const [sendQueueMessage, { loading: sendLoading }] = useMutation(TechAdminQueueExplorerContainerSendQueueMessageDocument);

	const refreshMessages = () => {
		if (!selectedQueue) return;
		void loadMessages({ variables: { input: { queueName: selectedQueue, maxMessages: 32 } } });
	};

	const handleSelectQueue = (queueName: string) => {
		setSelectedQueue(queueName);
		void loadMessages({ variables: { input: { queueName, maxMessages: 32 } } });
	};

	const handleSendMessage = async (payloadText: string, reason: string): Promise<boolean> => {
		if (!selectedQueue) return false;

		let payload: unknown;
		try {
			payload = JSON.parse(payloadText) as unknown;
		} catch {
			message.error('Enter a valid JSON payload');
			return false;
		}

		try {
			const result = await sendQueueMessage({ variables: { input: { queueName: selectedQueue, payload, reason } } });
			const { status } = result.data?.techAdminQueueSend ?? {};
			if (!status?.success) {
				message.error(status?.errorMessage ?? 'Unable to send the queue message');
				return false;
			}
			message.success('Queue message sent');
			refreshMessages();
			return true;
		} catch {
			message.error('Unable to send the queue message');
			return false;
		}
	};

	const errorMessage = queueError?.message ?? messageError?.message;
	const props: QueueExplorerProps = {
		queues: queueData?.techAdminQueues ?? [],
		messages: messageData?.techAdminQueuePeek ?? [],
		selectedQueue,
		queueLoading,
		messageLoading,
		sendLoading,
		canSendQueueMessages,
		errorMessage,
		onRefreshQueues: () => void refetchQueues(),
		onSelectQueue: handleSelectQueue,
		onCloseMessages: () => setSelectedQueue(undefined),
		onRefreshMessages: refreshMessages,
		onSendMessage: handleSendMessage,
	};

	return <QueueExplorer {...props} />;
};
