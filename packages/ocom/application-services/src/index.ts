import type { ApiContextSpec } from '@ocom/context-spec';
import { Domain } from '@ocom/domain';
import { Community, type CommunityContextApplicationService } from './contexts/community/index.ts';
import { Property, type PropertyContextApplicationService } from './contexts/property/index.ts';
import { Service, type ServiceContextApplicationService } from './contexts/service/index.ts';
import { User, type UserContextApplicationService } from './contexts/user/index.ts';

export type { CommunityUpdateSettingsCommand } from './contexts/community/index.ts';
export type {
	PropertyAdditionalAmenityCommand,
	PropertyAddressFieldsCommand,
	PropertyBedroomDetailCommand,
	PropertyCreateCommand,
	PropertyFieldsCommand,
	PropertyListingDetailFieldsCommand,
	PropertyLocationFieldsCommand,
	PropertyUpdateCommand,
	PropertyUpdateListingDetailCommand,
} from './contexts/property/property/index.ts';

export interface ApplicationServices {
	Community: CommunityContextApplicationService;
	Property: PropertyContextApplicationService;
	Service: ServiceContextApplicationService;
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

const isUnpopulatedMemberRoleError = (error: unknown): boolean => error instanceof Error && (error.message === 'role is not populated' || error.message === 'role is not populated or is not of the correct type');

/**
 * Members without an assigned role are valid route-denial subjects. Domain
 * member references expose `role` as a required populated reference, so an
 * absent persisted role throws when its getter is read. Treat that expected
 * absence as ineligible rather than failing request-context construction.
 */
const hasResolvedMemberRole = (member: Domain.Contexts.Community.Member.MemberEntityReference | null): boolean => {
	if (!member) {
		return false;
	}
	try {
		return Boolean(member.role);
	} catch (error) {
		if (isUnpopulatedMemberRoleError(error)) {
			return false;
		}
		throw error;
	}
};

export const buildApplicationServicesFactory = (context: ApiContextSpec): ApplicationServicesFactory => {
	const forRequest = async (rawAuthHeader?: string, hints?: PrincipalHints): Promise<ApplicationServices> => {
		const accessToken = rawAuthHeader?.replace(/^Bearer\s+/i, '').trim();
		const tokenValidationResult = accessToken ? await context.tokenValidationService.verifyJwt<VerifiedJwt>(accessToken) : null;
		let passport = Domain.PassportFactory.forGuest();
		let currentMember: Domain.Contexts.Community.Member.MemberEntityReference | null = null;
		if (tokenValidationResult !== null) {
			const { verifiedJwt, openIdConfigKey } = tokenValidationResult;
			const { readonlyDataSource } = context.dataSourcesFactory.withSystemPassport();
			if (openIdConfigKey === 'AccountPortal') {
				const endUser = await readonlyDataSource.User.EndUser.EndUserReadRepo.getByExternalId(verifiedJwt.sub);
				const member = endUser && hints?.communityId ? await readonlyDataSource.Community.Member.MemberReadRepo.getByEndUserIdAndCommunityIdWithRole(endUser.id, hints.communityId) : null;

				// A selected community is not an authentication claim, but it can
				// scope the canonical membership lookup. The member ID header is
				// intentionally never consulted as actor identity.
				if (endUser && member && hasResolvedMemberRole(member)) {
					passport = Domain.PassportFactory.forMember(endUser, member, member.community);
					currentMember = member;
				}
			} else if (openIdConfigKey === 'StaffPortal') {
				const staffUser = await readonlyDataSource.User.StaffUser.StaffUserReadRepo.getByExternalId(verifiedJwt.sub);
				if (staffUser) {
					passport = Domain.PassportFactory.forStaffUser(staffUser);
				}
			}
		}

		const { dataSourcesFactory, blobStorageService, queueStorageService } = context;

		const dataSources = dataSourcesFactory.withPassport(passport);

		return {
			Community: Community(dataSources, blobStorageService, queueStorageService),
			Property: Property(dataSources, { currentMember }),
			Service: Service(dataSources),
			User: User(dataSources),
			get verifiedUser(): VerifiedUser | null {
				return { ...tokenValidationResult, hints: hints };
			},
		};
	};

	return {
		forRequest,
	};
};
