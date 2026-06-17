import type { QueueStorageOperations } from '@ocom/service-queue-storage';

export interface RecordedCommunityCreationMessage {
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
		receiveFromEndUserUpdateQueue() {
			return Promise.resolve(undefined);
		},
		peekAtEndUserUpdateQueue() {
			return Promise.resolve([]);
		},
	};
}
