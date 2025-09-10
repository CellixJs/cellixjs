import type { DataSources } from '@ocom/api-persistence';
import { Community as CommunityApi, type CommunityApplicationService } from './community/index.ts';
import { Member as MemberApi, type MemberApplicationService } from './member/index.ts';

export interface CommunityContextApplicationService {
    Community: CommunityApplicationService;
    Member: MemberApplicationService;
}

export const Community = (
    dataSources: DataSources
): CommunityContextApplicationService => {
    return {
        Community: CommunityApi(dataSources),
        Member: MemberApi(dataSources),
    }
}