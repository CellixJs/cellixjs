import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations } from '@ocom/service-blob-storage';
import { Community as CommunityApi, type CommunityApplicationService } from './community/index.ts';
import { Member as MemberApi, type MemberApplicationService } from './member/index.ts';
import { Role as RoleApi, type RoleContext } from './role/index.ts';

export type { CommunityUpdateSettingsCommand } from './community/index.ts';

export interface CommunityContextApplicationService {
	Community: CommunityApplicationService;
	Member: MemberApplicationService;
	Role: RoleContext;
}

export const Community = (dataSources: DataSources, blobStorageService: BlobStorageOperations): CommunityContextApplicationService => {
	return {
		Community: CommunityApi(dataSources, blobStorageService),
		Member: MemberApi(dataSources),
		Role: RoleApi(dataSources),
	};
};
