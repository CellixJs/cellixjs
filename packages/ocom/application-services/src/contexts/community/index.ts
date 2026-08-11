import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations } from '@ocom/service-blob-storage';
import type { QueueStorageOperations } from '@ocom/service-queue-storage';
import type { RateLimitSubject, RateLimitingService } from '@cagematch/rate-limiting';
import { Community as CommunityApi, type CommunityApplicationService } from './community/index.ts';
import { Member as MemberApi, type MemberApplicationService } from './member/index.ts';
import { Role as RoleApi, type RoleContext } from './role/index.ts';

export type { CommunityUpdateSettingsCommand } from './community/index.ts';

export interface CommunityContextApplicationService {
	Community: CommunityApplicationService;
	Member: MemberApplicationService;
	Role: RoleContext;
}

export const Community = (
	dataSources: DataSources,
	blobStorageService: BlobStorageOperations,
	queueStorageService: QueueStorageOperations,
	rateLimitingService: RateLimitingService,
	rateLimitPrincipal: RateLimitSubject,
): CommunityContextApplicationService => {
	return {
		Community: CommunityApi(dataSources, blobStorageService, queueStorageService, rateLimitingService, rateLimitPrincipal),
		Member: MemberApi(dataSources),
		Role: RoleApi(dataSources),
	};
};
