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
		throw new Error(PERMISSION_ERROR_MESSAGE);
	}

	const members = await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getMembersForEndUserExternalId(endUserExternalId);
	const match = members.find((member) => member.communityId === communityId);
	if (!match) {
		throw new Error(PERMISSION_ERROR_MESSAGE);
	}

	const member = await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getByIdWithCommunityAndRoleAndUser(match.id);
	const community = await dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getById(communityId);
	if (!member || !community) {
		throw new Error(PERMISSION_ERROR_MESSAGE);
	}

	return {
		passport: Domain.PassportFactory.forMember(endUser, member, community),
		community,
	};
}

export async function resolveCommunityBillingPassport(dataSources: DataSources, communityId: string, endUserExternalId: string): Promise<Domain.Passport> {
	const { passport, community } = await resolveActingMemberPassport(dataSources, communityId, endUserExternalId);
	if (!passport.community.forCommunity(community).determineIf((permissions) => permissions.canManageCommunitySettings || permissions.isSystemAccount)) {
		throw new Error(PERMISSION_ERROR_MESSAGE);
	}
	return passport;
}
