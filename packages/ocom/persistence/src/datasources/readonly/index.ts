import type { Passport } from '@ocom/domain';
import type { ModelsContext } from '../../index.ts';
import type * as Community from './community/community/index.ts';
import { CommunityContext } from './community/index.ts';
import type * as Member from './community/member/index.ts';
import type * as EndUser from './user/end-user/index.ts';
import { UserContext } from './user/index.ts';

import { Community } from '@ocom/domain/contexts/community/community';
import { Member } from '@ocom/domain/contexts/community/member';
import { EndUser } from '@ocom/domain/contexts/user/end-user';
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

export const ReadonlyDataSourceImplementation = (models: ModelsContext, passport: Passport): ReadonlyDataSource => ({
    Community: CommunityContext(models, passport),
    User: UserContext(models, passport)
});
