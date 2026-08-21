import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations } from '@ocom/service-blob-storage';
import type { QueueStorageOperations } from '@ocom/service-queue-storage';
import { Community as CommunityApi, type CommunityApplicationService } from './community/index.ts';
import { Member as MemberApi, type MemberApplicationService } from './member/index.ts';
import { Role as RoleApi, type RoleContext } from './role/index.ts';

export type { CommunityUpdateSettingsCommand } from './community/index.ts';

export interface CommunityContextApplicationService {
	Community: CommunityApplicationService;
	Member: MemberApplicationService;
	Role: RoleContext;
}

export const Community = (dataSources: DataSources, blobStorageService: BlobStorageOperations, queueStorageService: QueueStorageOperations): CommunityContextApplicationService => {
	return {
		Community: CommunityApi(dataSources, blobStorageService, queueStorageService),
		Member: MemberApi(dataSources),
		Role: RoleApi(dataSources),
	};
};
