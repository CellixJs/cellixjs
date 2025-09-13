import type { Contexts } from './domain/index.ts';

export * as Domain from './domain/index.ts';

export interface DomainDataSource {
	Community: {
		Community: {
			CommunityUnitOfWork: Contexts.Community.Community.CommunityUnitOfWork;
		};
        Member: {
            MemberUnitOfWork: Contexts.Community.Member.MemberUnitOfWork;
        };
        Role: {
            EndUserRole: {
                EndUserRoleUnitOfWork: Contexts.Community.Role.EndUserRole.EndUserRoleUnitOfWork;
            };
        };
	};
	User: {
		EndUser: {
			EndUserUnitOfWork: Contexts.User.EndUser.EndUserUnitOfWork;
		};
	};
}
