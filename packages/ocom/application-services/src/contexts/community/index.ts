import type { DataSources } from '@ocom/persistence';
import { Community as CommunityApi, type CommunityApplicationService, type CommunityUpdateSettingsCommand } from './community/index.ts';
import { Member as MemberApi, type MemberApplicationService } from './member/index.ts';
import { Role as RoleApi, type RoleContext } from './role/index.ts';

export type { CommunityUpdateSettingsCommand };

export interface CommunityContextApplicationService {
	Community: CommunityApplicationService;
	Member: MemberApplicationService;
	Role: RoleContext;
}

export const Community = (dataSources: DataSources): CommunityContextApplicationService => {
	return {
		Community: CommunityApi(dataSources),
		Member: MemberApi(dataSources),
		Role: RoleApi(dataSources),
	};
};
