import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Empty, Input, Modal, Space, Spin, Table, type TableColumnsType, Typography } from 'antd';
import type React from 'react';
import { useState } from 'react';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface QueueExplorerMessage {
	id: string;
	popReceipt?: string | null;
	payload: unknown;
	dequeueCount?: number | null;
}

interface QueueExplorerQueueRow {
	key: string;
	regularQueue?: string;
	regularQueueCount?: number | null;
	regularQueueError?: string | null;
	poisonQueue?: string;
	poisonQueueCount?: number | null;
	poisonQueueError?: string | null;
}

interface QueueExplorerQueue {
	name: string;
	messageCount?: {
		value?: number | null;
		errorMessage?: string | null;
	} | null;
}

export interface QueueExplorerProps {
	queues: readonly QueueExplorerQueue[];
	messages: readonly QueueExplorerMessage[];
	selectedQueue?: string | undefined;
	queueLoading: boolean;
	messageLoading: boolean;
	sendLoading: boolean;
	canSendQueueMessages: boolean;
	errorMessage?: string | undefined;
	onRefreshQueues: () => void;
	onSelectQueue: (queueName: string) => void;
	onCloseMessages: () => void;
	onRefreshMessages: () => void;
	onSendMessage: (payload: string, reason: string) => Promise<boolean>;
}

const formatPayload = (payload: unknown): string => {
	if (typeof payload === 'string') return payload;
	return JSON.stringify(payload, null, 2);
};

const poisonQueueSuffix = '-poison';

const renderQueueCount = (messageCount: number | null | undefined, errorMessage: string | null | undefined): React.ReactNode => {
	if (errorMessage) return <Text type="danger">{errorMessage}</Text>;
	return messageCount ?? 'N/A';
};

const toQueueRows = (queues: readonly QueueExplorerQueue[]): QueueExplorerQueueRow[] => {
	const queuesByName = new Map(queues.map((queue) => [queue.name, queue]));
	const regularQueues = queues.filter(({ name }) => !name.endsWith(poisonQueueSuffix));
	const orphanedPoisonQueues = queues.filter(({ name }) => name.endsWith(poisonQueueSuffix) && !queuesByName.has(name.slice(0, -poisonQueueSuffix.length)));

	return [
		...regularQueues.map((regularQueue) => {
			const poisonQueue = queuesByName.get(`${regularQueue.name}${poisonQueueSuffix}`);

			return {
				key: regularQueue.name,
				regularQueue: regularQueue.name,
				...(regularQueue.messageCount?.value === undefined ? {} : { regularQueueCount: regularQueue.messageCount.value }),
				...(regularQueue.messageCount?.errorMessage === undefined ? {} : { regularQueueError: regularQueue.messageCount.errorMessage }),
				...(poisonQueue === undefined
					? {}
					: {
							poisonQueue: poisonQueue.name,
							...(poisonQueue.messageCount?.value === undefined ? {} : { poisonQueueCount: poisonQueue.messageCount.value }),
							...(poisonQueue.messageCount?.errorMessage === undefined ? {} : { poisonQueueError: poisonQueue.messageCount.errorMessage }),
						}),
			};
		}),
		...orphanedPoisonQueues.map((poisonQueue) => ({
			key: poisonQueue.name,
			poisonQueue: poisonQueue.name,
			...(poisonQueue.messageCount?.value === undefined ? {} : { poisonQueueCount: poisonQueue.messageCount.value }),
			...(poisonQueue.messageCount?.errorMessage === undefined ? {} : { poisonQueueError: poisonQueue.messageCount.errorMessage }),
		})),
	];
};

export const QueueExplorer: React.FC<QueueExplorerProps> = ({
	queues,
	messages,
	selectedQueue,
	queueLoading,
	messageLoading,
	sendLoading,
	canSendQueueMessages,
	errorMessage,
	onRefreshQueues,
	onSelectQueue,
	onCloseMessages,
	onRefreshMessages,
	onSendMessage,
}) => {
	const [isSendModalOpen, setIsSendModalOpen] = useState(false);
	const [payload, setPayload] = useState('');
	const [reason, setReason] = useState('');
	const queueRows = toQueueRows(queues);
	const isPoisonQueue = selectedQueue?.endsWith(poisonQueueSuffix) === true;

	const queueColumns: TableColumnsType<QueueExplorerQueueRow> = [
		{
			title: 'Regular Queue',
			dataIndex: 'regularQueue',
			key: 'regularQueue',
			render: (queueName: string | undefined) =>
				queueName && (
					<Button
						type="link"
						onClick={() => onSelectQueue(queueName)}
					>
						{queueName}
					</Button>
				),
			sorter: (left, right) => (left.regularQueue ?? '').localeCompare(right.regularQueue ?? ''),
			defaultSortOrder: 'ascend',
		},
		{
			title: 'Message Count',
			dataIndex: 'regularQueueCount',
			key: 'regularQueueCount',
			render: (messageCount: number | null | undefined, record) => record.regularQueue && renderQueueCount(messageCount, record.regularQueueError),
			sorter: (left, right) => (left.regularQueueCount ?? -1) - (right.regularQueueCount ?? -1),
		},
		{
			title: 'Poison Queue',
			dataIndex: 'poisonQueue',
			key: 'poisonQueue',
			render: (queueName: string | undefined) =>
				queueName && (
					<Button
						type="link"
						onClick={() => onSelectQueue(queueName)}
					>
						{queueName}
					</Button>
				),
			sorter: (left, right) => (left.poisonQueue ?? '').localeCompare(right.poisonQueue ?? ''),
		},
		{
			title: 'Message Count',
			dataIndex: 'poisonQueueCount',
			key: 'poisonQueueCount',
			render: (messageCount: number | null | undefined, record) => record.poisonQueue && renderQueueCount(messageCount, record.poisonQueueError),
			sorter: (left, right) => (left.poisonQueueCount ?? -1) - (right.poisonQueueCount ?? -1),
		},
	];

	const messageColumns: TableColumnsType<QueueExplorerMessage> = [
		{
			title: 'Message ID',
			dataIndex: 'id',
			key: 'id',
			sorter: (left, right) => left.id.localeCompare(right.id),
		},
		{
			title: 'Payload',
			dataIndex: 'payload',
			key: 'payload',
			render: (messagePayload: unknown) => <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{formatPayload(messagePayload)}</pre>,
		},
		{
			title: 'Dequeue Count',
			dataIndex: 'dequeueCount',
			key: 'dequeueCount',
			width: 140,
			render: (dequeueCount: number | null | undefined) => dequeueCount ?? 'N/A',
			sorter: (left, right) => (left.dequeueCount ?? 0) - (right.dequeueCount ?? 0),
		},
	];

	const closeSendModal = () => {
		setPayload('');
		setReason('');
		setIsSendModalOpen(false);
	};

	const handleSendMessage = async () => {
		if (await onSendMessage(payload, reason)) {
			closeSendModal();
		}
	};

	return (
		<>
			<Space
				direction="vertical"
				size="middle"
				style={{ display: 'flex', padding: '24px' }}
			>
				<div>
					<Title level={2}>Queue Explorer</Title>
					<Text type="secondary">Inspect registered queues and their most recent messages.</Text>
				</div>
				<Button
					type="primary"
					icon={<ReloadOutlined />}
					onClick={onRefreshQueues}
					loading={queueLoading}
				>
					Refresh
				</Button>
				{errorMessage && <Text type="danger">{errorMessage}</Text>}
				<Table
					rowKey="key"
					columns={queueColumns}
					dataSource={queueRows}
					loading={queueLoading}
					bordered
					pagination={false}
					locale={{ emptyText: <Empty description="No queues are registered" /> }}
				/>
			</Space>

			<Modal
				open={selectedQueue !== undefined}
				title={selectedQueue ? `Messages in: ${selectedQueue}` : 'Queue Messages'}
				onCancel={onCloseMessages}
				footer={null}
				destroyOnHidden
				width="90%"
			>
				<Space
					direction="vertical"
					size="middle"
					style={{ display: 'flex' }}
				>
					<Text type="secondary">Results are limited to the most recent 32 messages.</Text>
					<Space>
						<Button
							icon={<ReloadOutlined />}
							onClick={onRefreshMessages}
							loading={messageLoading}
						>
							Refresh
						</Button>
						{!isPoisonQueue && (
							<Button
								type="primary"
								icon={<PlusOutlined />}
								onClick={() => setIsSendModalOpen(true)}
								disabled={!canSendQueueMessages}
							>
								Send Message
							</Button>
						)}
					</Space>
					{messageLoading ? (
						<div style={{ padding: '80px 40px', textAlign: 'center' }}>
							<Spin size="large" />
						</div>
					) : (
						<Table
							rowKey="id"
							columns={messageColumns}
							dataSource={messages}
							bordered
							pagination={false}
							scroll={{ x: 'max-content' }}
							locale={{ emptyText: <Empty description="No messages found" /> }}
						/>
					)}
				</Space>
			</Modal>

			<Modal
				open={isSendModalOpen}
				title={selectedQueue ? `Send Message: ${selectedQueue}` : 'Send Message'}
				onCancel={closeSendModal}
				onOk={() => void handleSendMessage()}
				okText="Send"
				okButtonProps={{ loading: sendLoading, disabled: payload.trim().length === 0 || reason.trim().length === 0 }}
				destroyOnHidden
			>
				<TextArea
					rows={12}
					placeholder="Enter a JSON payload"
					value={payload}
					onChange={(event) => setPayload(event.target.value)}
				/>
				<Input
					aria-label="Reason for sending this message"
					placeholder="Reason for sending this message"
					value={reason}
					onChange={(event) => setReason(event.target.value)}
					style={{ marginTop: '16px' }}
				/>
			</Modal>
		</>
	);
};
