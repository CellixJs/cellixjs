import type { Passport } from '@ocom/domain/contexts/passport';
import type { ModelsContext } from '../../index.ts';
import type { CommunityReadRepository } from './community/community/community.read-repository.ts';
import { CommunityContext } from './community/index.ts';
import type { MemberReadRepository } from './community/member/member.read-repository.ts';
import type { EndUserReadRepository } from './user/end-user/end-user.read-repository.ts';
import { UserContext } from './user/index.ts';

export interface ReadonlyDataSource {
    Community: {
        Community: {
            CommunityReadRepo: CommunityReadRepository;
        };
        Member: {
            MemberReadRepo: MemberReadRepository;
        }
    };
    User: {
        EndUser: {
            EndUserReadRepo: EndUserReadRepository;
        }
    }
}

export const ReadonlyDataSourceImplementation = (models: ModelsContext, passport: Passport): ReadonlyDataSource => ({
    Community: CommunityContext(models, passport),
    User: UserContext(models, passport)
});
