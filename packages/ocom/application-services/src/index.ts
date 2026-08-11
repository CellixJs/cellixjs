import type { ApiContextSpec } from '@ocom/context-spec';
import type { RateLimitSubject, RateLimitingService } from '@cagematch/rate-limiting';
import { Domain } from '@ocom/domain';
import { Community, type CommunityContextApplicationService } from './contexts/community/index.ts';
import { Service, type ServiceContextApplicationService } from './contexts/service/index.ts';
import { User, type UserContextApplicationService } from './contexts/user/index.ts';

export type { CommunityUpdateSettingsCommand } from './contexts/community/index.ts';

export interface ApplicationServices {
	Community: CommunityContextApplicationService;
	Service: ServiceContextApplicationService;
	User: UserContextApplicationService;
	rateLimitingService: RateLimitingService;
	readonly rateLimitPrincipal: RateLimitSubject;
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

export const buildApplicationServicesFactory = (context: ApiContextSpec): ApplicationServicesFactory => {
	const forRequest = async (rawAuthHeader?: string, hints?: PrincipalHints): Promise<ApplicationServices> => {
		const accessToken = rawAuthHeader?.replace(/^Bearer\s+/i, '').trim();
		const tokenValidationResult = accessToken ? await context.tokenValidationService.verifyJwt<VerifiedJwt>(accessToken) : null;
		let passport = Domain.PassportFactory.forGuest();
		let rateLimitPrincipal: RateLimitSubject = {
			id: 'anonymous',
			accountType: 'anonymous',
		};
		if (tokenValidationResult !== null) {
			const { verifiedJwt, openIdConfigKey } = tokenValidationResult;
			const { readonlyDataSource } = context.dataSourcesFactory.withSystemPassport();
			if (openIdConfigKey === 'AccountPortal') {
				const endUser = await readonlyDataSource.User.EndUser.EndUserReadRepo.getByExternalId(verifiedJwt.sub);
				const member = hints?.memberId ? await readonlyDataSource.Community.Member.MemberReadRepo.getByIdWithCommunityAndRoleAndUser(hints?.memberId) : null;
				const community = hints?.communityId ? await readonlyDataSource.Community.Community.CommunityReadRepo.getById(hints?.communityId) : null;
				rateLimitPrincipal = {
					id: verifiedJwt.sub,
					accountType: 'account',
				};

				if (endUser && member && community) {
					passport = Domain.PassportFactory.forMember(endUser, member, community);
					rateLimitPrincipal = { ...rateLimitPrincipal, tenantId: community.id };
				}
			} else if (openIdConfigKey === 'StaffPortal') {
				const staffUser = await readonlyDataSource.User.StaffUser.StaffUserReadRepo.getByExternalId(verifiedJwt.sub);
				const staffRole = staffUser?.role?.roleName ?? verifiedJwt.roles?.[0];
				rateLimitPrincipal = {
					id: verifiedJwt.sub,
					accountType: 'staff',
					...(staffRole ? { staffRole } : {}),
				};
				if (staffUser) {
					passport = Domain.PassportFactory.forStaffUser(staffUser);
				}
			}
		}

		const { dataSourcesFactory, blobStorageService, queueStorageService } = context;

		const dataSources = dataSourcesFactory.withPassport(passport);

		return {
			Community: Community(dataSources, blobStorageService, queueStorageService, context.rateLimitingService, rateLimitPrincipal),
			Service: Service(dataSources),
			User: User(dataSources),
			rateLimitingService: context.rateLimitingService,
			get rateLimitPrincipal(): RateLimitSubject {
				return rateLimitPrincipal;
			},
			get verifiedUser(): VerifiedUser | null {
				return { ...tokenValidationResult, hints: hints };
			},
		};
	};

	return {
		forRequest,
	};
};
