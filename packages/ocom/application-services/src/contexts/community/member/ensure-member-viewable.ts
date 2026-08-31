import type { Domain } from '@ocom/domain';

const communityReference = (communityId: string): Domain.Contexts.Community.Community.CommunityEntityReference => ({ id: communityId }) as Domain.Contexts.Community.Community.CommunityEntityReference;

export const ensureCommunityMembersViewable = (passport: Domain.Passport, communityId: string): void => {
	const canView = passport.community.forCommunity(communityReference(communityId)).determineIf((permissions) => permissions.isSystemAccount || permissions.canManageMembers);
	if (!canView) {
		throw new Error('Unauthorized');
	}
};

export const ensureMemberViewable = (passport: Domain.Passport, member: Domain.Contexts.Community.Member.MemberEntityReference): void => {
	ensureCommunityMembersViewable(passport, String(member.communityId));
};
