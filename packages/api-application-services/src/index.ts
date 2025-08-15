import type { ApiContextSpec } from '@ocom/api-context-spec';
import { Domain } from '@ocom/api-domain';
import { Community, type CommunityContextApplicationService } from './contexts/community/index.ts';
import { User, type UserContextApplicationService } from './contexts/user/index.ts';

export interface ApplicationServices {
    Community: CommunityContextApplicationService;
    User: UserContextApplicationService;
}

export interface VerifiedJwt {
  given_name: string;
  family_name: string;
  email: string;
  sub: string;
  oid?: string;
  unique_name?: string;
  roles?: string[];
}

export type PrincipalHints = {
    memberId: string | undefined;
    communityId: string | undefined;
};

export interface AppServicesHost<S> {
    forRequest(rawAuthHeader?: string, hints?: PrincipalHints): Promise<S>;
    // forSystem: (opts?: unknown) => Promise<S>;
    // forAzureFunction: (opts?: unknown) => Promise<S>;
}

export type ApplicationServicesFactory = AppServicesHost<ApplicationServices>;

export const buildApplicationServicesFactory = (infrastructureServicesRegistry: ApiContextSpec): ApplicationServicesFactory => {

    const forRequest = async (rawAuthHeader?: string, hints?: PrincipalHints): Promise<ApplicationServices> => {
        const accessToken = rawAuthHeader?.replace(/^Bearer\s+/i, '').trim();
        const tokenValidationResult = accessToken
            ? await infrastructureServicesRegistry.tokenValidationService.verifyJwt<VerifiedJwt>(accessToken)
            : null;
        let passport = Domain.PassportFactory.forGuest();
        if (tokenValidationResult !== null) {
            const { verifiedJwt, openIdConfigKey } = tokenValidationResult;
            const { readonlyDataSource } = infrastructureServicesRegistry.dataSourcesFactory.withSystemPassport();
            if (openIdConfigKey === 'AccountPortal') {
                await Promise.resolve(); 
                const endUser = await readonlyDataSource.User.EndUser.EndUserReadRepo.getByExternalId(verifiedJwt.sub);
                const member = hints?.memberId ? await readonlyDataSource.Community.Member.MemberReadRepo.getByIdWithRole(hints?.memberId) : null;
                const community = hints?.communityId ? await readonlyDataSource.Community.Community.CommunityReadRepo.getById(hints?.communityId) : null;

                if (endUser && member && community) {
                    passport = Domain.PassportFactory.forMember(endUser, member, community);
                }
            } else if (openIdConfigKey === 'StaffPortal') {
                const staffUser = undefined;
                // const staffUser = await readonlyDataSource.User.StaffUser.StaffUserReadRepo.getByExternalId(verifiedJwt.sub);
                if (staffUser) {
                    passport = Domain.PassportFactory.forStaffUser(staffUser);
                }
            }
        }

        const dataSources = infrastructureServicesRegistry.dataSourcesFactory.withPassport(passport);

        return {
            Community: Community(dataSources),
            User: User(dataSources)
        }
    }

    return {
        forRequest
    }
}