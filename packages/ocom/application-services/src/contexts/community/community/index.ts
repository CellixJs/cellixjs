import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations } from '@ocom/service-blob-storage';
import type { QueueStorageOperations } from '@ocom/service-queue-storage';
import { type CommunityCreateCommand, create } from './create.ts';
import { type CommunityQueryByEndUserExternalIdCommand, queryByEndUserExternalId } from './query-by-end-user-external-id.ts';
import { type CommunityQueryByIdCommand, queryById } from './query-by-id.ts';
import { type CommunityUpdateSettingsCommand, updateSettings } from './update-settings.ts';

export type { CommunityUpdateSettingsCommand };

export interface CommunityApplicationService {
	create: (command: CommunityCreateCommand) => Promise<Domain.Contexts.Community.Community.CommunityEntityReference>;
	queryById: (command: CommunityQueryByIdCommand) => Promise<Domain.Contexts.Community.Community.CommunityEntityReference | null>;
	queryByEndUserExternalId: (command: CommunityQueryByEndUserExternalIdCommand) => Promise<Domain.Contexts.Community.Community.CommunityEntityReference[]>;
	updateSettings: (command: CommunityUpdateSettingsCommand) => Promise<Domain.Contexts.Community.Community.CommunityEntityReference>;
}

export const Community = (dataSources: DataSources, blobStorageService: BlobStorageOperations, queueStorageService: QueueStorageOperations): CommunityApplicationService => {
	return {
		create: create(dataSources, blobStorageService, queueStorageService),
		queryById: queryById(dataSources),
		queryByEndUserExternalId: queryByEndUserExternalId(dataSources),
		updateSettings: updateSettings(dataSources),
	};
};
