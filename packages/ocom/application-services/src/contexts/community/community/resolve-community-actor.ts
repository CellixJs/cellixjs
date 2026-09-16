import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

const PERMISSION_ERROR_MESSAGE = 'permission denied: actor cannot manage community settings';

export async function resolveActingMemberPassport(
	dataSources: DataSources,
	communityId: string,
	endUserExternalId: string,
): Promise<{
	passport: Domain.Passport;
	community: Domain.Contexts.Community.Community.CommunityEntityReference;
}> {
	const endUser = await dataSources.readonlyDataSource.User.EndUser.EndUserReadRepo.getByExternalId(endUserExternalId);
	if (!endUser) {
		throw new PermissionError(PERMISSION_ERROR_MESSAGE);
	}

	const members = await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getMembersForEndUserExternalId(endUserExternalId);
	const match = members.find((member) => member.communityId === communityId);
	if (!match) {
		throw new PermissionError(PERMISSION_ERROR_MESSAGE);
	}

	const member = await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getByIdWithCommunityAndRoleAndUser(match.id);
	const community = await dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getById(communityId);
	if (!member || !community) {
		throw new PermissionError(PERMISSION_ERROR_MESSAGE);
	}

	return {
		passport: Domain.PassportFactory.forMember(endUser, member, community),
		community,
	};
}

export async function resolveCommunityBillingPassport(dataSources: DataSources, communityId: string, endUserExternalId: string): Promise<Domain.Passport> {
	const { passport, community } = await resolveActingMemberPassport(dataSources, communityId, endUserExternalId);
	if (!passport.community.forCommunity(community).determineIf((permissions) => permissions.canManageCommunitySettings || permissions.isSystemAccount)) {
		throw new PermissionError(PERMISSION_ERROR_MESSAGE);
	}
	return passport;
}

/**
 * Non-throwing variant used by read paths that hide billing fields from actors who
 * may legitimately read the rest of the community.
 */
export async function actorCanManageCommunityBilling(dataSources: DataSources, communityId: string, endUserExternalId: string | undefined): Promise<boolean> {
	if (!endUserExternalId) {
		return false;
	}
	try {
		await resolveCommunityBillingPassport(dataSources, communityId, endUserExternalId);
		return true;
	} catch (error) {
		if (error instanceof PermissionError) {
			return false;
		}
		throw error;
	}
}
