export interface MemberProfileExpectation {
	name?: string;
	email?: string;
	bio?: string;
	avatarDocumentId?: string;
	interests?: string[];
	showInterests?: boolean;
	showEmail?: boolean;
	showProfile?: boolean;
	showLocation?: boolean;
	showProperties?: boolean;
}

export interface MemberE2ENotes {
	communityIdsByName: Record<string, string>;
	endUserEmailsByLabel: Record<string, string>;
	endUserDisplayNamesByLabel: Record<string, string>;
	endUserExternalIdsByLabel: Record<string, string>;
	lastMemberCommunityId: string | null;
	lastMemberCommunityName: string | null;
	lastMemberId: string | null;
	lastMemberName: string;
	lastExpectedMemberProfile?: MemberProfileExpectation;
	lastUpdatedMemberProfile?: MemberProfileExpectation;
	lastMemberStatus: string | null;
	errorMessage: string | null;
	routeMemberId: string | null;
}
