import type { PersistenceFactory } from '../../types.ts';
import type * as Community from './community/community/index.ts';
import { CommunityContext } from './community/index.ts';
import type * as Member from './community/member/index.ts';
import type * as EndUser from './user/end-user/index.ts';
import { UserContext } from './user/index.ts';

export interface ReadonlyDataSource {
    Community: {
        Community: {
            CommunityReadRepo: Community.CommunityReadRepository;
        };
        Member: {
            MemberReadRepo: Member.MemberReadRepository;
        }
    };
    User: {
        EndUser: {
            EndUserReadRepo: EndUser.EndUserReadRepository;
        }
    }
}

export const ReadonlyDataSourceImplementation: PersistenceFactory<ReadonlyDataSource> = (models, passport) => ({
    Community: CommunityContext(models, passport),
    User: UserContext(models, passport)
});
