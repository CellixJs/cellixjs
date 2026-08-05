import type { DataSources } from '@ocom/persistence';
import type { QueueStorageOperations } from '@ocom/service-queue-storage';
import { TechAdminQueue, type TechAdminQueueApplicationService } from './queue/index.ts';

export interface TechAdminContextApplicationService {
	Queue: TechAdminQueueApplicationService;
}

export const TechAdmin = (dataSources: DataSources, queueStorageService: QueueStorageOperations, staffUserExternalId: string | undefined): TechAdminContextApplicationService => {
	return {
		Queue: TechAdminQueue(dataSources, queueStorageService, staffUserExternalId),
	};
};
