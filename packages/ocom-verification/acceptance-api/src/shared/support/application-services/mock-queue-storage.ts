import type { QueueStorageOperations } from '@ocom/service-queue-storage';

interface RecordedCommunityCreationMessage {
	communityId: string;
	name: string;
	createdBy: string;
}

const communityCreationMessages: RecordedCommunityCreationMessage[] = [];

export function resetRecordedQueueMessages(): void {
	communityCreationMessages.length = 0;
}

export function getRecordedCommunityCreationMessages(): RecordedCommunityCreationMessage[] {
	return [...communityCreationMessages];
}

export function createRecordingQueueStorageService(): QueueStorageOperations {
	return {
		sendMessageToCommunityCreationQueue(payload) {
			communityCreationMessages.push(payload);
			return Promise.resolve();
		},
		peekAtCommunityCreationQueue() {
			return Promise.resolve(
				communityCreationMessages.map((payload, index) => ({
					id: `recorded-${index}`,
					payload,
					dequeueCount: 0,
				})),
			);
		},
		receiveFromEndUserUpdateQueue(_payload: unknown, _metadata?: { id?: string; popReceipt?: string; dequeueCount?: number }) {
			return Promise.resolve({
				id: _metadata?.id ?? '',
				...( _metadata?.popReceipt !== undefined ? { popReceipt: _metadata.popReceipt } : {}),
				payload: _payload,
				...( _metadata?.dequeueCount !== undefined ? { dequeueCount: _metadata.dequeueCount } : {}),
			});
		},
		peekAtEndUserUpdateQueue() {
			return Promise.resolve([]);
		},
	};
}
