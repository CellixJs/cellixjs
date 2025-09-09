import type { ApiContextSpec } from '@ocom/api-context-spec';
import { Domain } from '@ocom/api-domain';
import { Community, type CommunityContextApplicationService } from './contexts/community/index.ts';
import { User, type UserContextApplicationService } from './contexts/user/index.ts';

export interface ApplicationServices {
    Community: CommunityContextApplicationService;
    User: UserContextApplicationService;
    get verifiedUser(): VerifiedUser | null;
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

export interface VerifiedUser {
  verifiedJwt?: VerifiedJwt | undefined;
  openIdConfigKey?: string | undefined;
  hints?: PrincipalHints | undefined;
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

    interface TokenValidationResult {
        verifiedJwt: VerifiedJwt;
        openIdConfigKey: string;
    }

    type ReadonlyDataSource = ReturnType<ApiContextSpec['dataSourcesFactory']['withSystemPassport']>;

    const createAccountPortalPassport = async (
        readonlyDataSource: ReadonlyDataSource,
        verifiedJwt: VerifiedJwt,
        hints?: PrincipalHints
    ) => {
        const endUser = await readonlyDataSource.User.EndUser.EndUserReadRepo.getByExternalId(verifiedJwt.sub);
        const member = hints?.memberId ? await readonlyDataSource.Community.Member.MemberReadRepo.getByIdWithRole(hints?.memberId) : null;
        const community = hints?.communityId ? await readonlyDataSource.Community.Community.CommunityReadRepo.getById(hints?.communityId) : null;

        if (endUser && member && community) {
            return Domain.PassportFactory.forMember(endUser, member, community);
        }

        return Domain.PassportFactory.forGuest();
    };

    const createStaffPortalPassport = async (
        readonlyDataSource: ReadonlyDataSource,
        verifiedJwt: VerifiedJwt
    ) => {
        // Implement staff user lookup logic here if needed
        // const staffUser = await readonlyDataSource.User.StaffUser.StaffUserReadRepo.getByExternalId(verifiedJwt.sub);
        // if (staffUser) {
        //     return Domain.PassportFactory.forStaffUser(staffUser);
        // }

        return Domain.PassportFactory.forGuest();
    };

    const createPassportFromToken = async (tokenValidationResult: TokenValidationResult | null, hints?: PrincipalHints) => {
        if (!tokenValidationResult) {
            return Domain.PassportFactory.forGuest();
        }

        const { verifiedJwt, openIdConfigKey } = tokenValidationResult;
        const { readonlyDataSource } = infrastructureServicesRegistry.dataSourcesFactory.withSystemPassport();

        if (openIdConfigKey === 'AccountPortal') {
            return await createAccountPortalPassport(readonlyDataSource, verifiedJwt, hints);
        }

        if (openIdConfigKey === 'StaffPortal') {
            return await createStaffPortalPassport(readonlyDataSource, verifiedJwt);
        }

        return Domain.PassportFactory.forGuest();
    };

    const forRequest = async (rawAuthHeader?: string, hints?: PrincipalHints): Promise<ApplicationServices> => {
        const accessToken = rawAuthHeader?.replace(/^Bearer\s+/i, '').trim();
        const tokenValidationResult = accessToken
            ? await infrastructureServicesRegistry.tokenValidationService.verifyJwt<VerifiedJwt>(accessToken)
            : null;

        const passport = await createPassportFromToken(tokenValidationResult, hints);
        const dataSources = infrastructureServicesRegistry.dataSourcesFactory.withPassport(passport);

        return {
            Community: Community(dataSources),
            User: User(dataSources),
            get verifiedUser(): VerifiedUser | null {
                return {...tokenValidationResult, hints: hints};
            }
        }
    }

    return {
        forRequest
    }
}