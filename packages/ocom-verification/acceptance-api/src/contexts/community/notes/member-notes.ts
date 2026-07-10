// export interface MemberDetails {
// 	memberName: string;
// 	role?: string;
// 	email?: string;
// }

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

export interface MemberNotes {
	communityIdsByName: Record<string, string>;
	lastMemberCommunityId: string;
	lastMemberId: string;
	lastMemberName: string;
	lastExpectedMemberProfile?: MemberProfileExpectation;
	lastMemberProfileEmail?: string;
	lastExpectedMemberProfileEmail?: string;
	lastMemberStatus: string;
	lastValidationError: string;
}
