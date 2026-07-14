export interface MemberUiNotes {
	endUserIdsByLabel: Record<string, string>;
	lastMemberId: string;
	lastLinkedEndUserId: string;
	memberCreated: boolean;
	memberRemoved: boolean;
	memberValidationError: string;
	memberAccountLinked: boolean;
	memberAccountCount: number;
	memberAuthorizationError: string;
	memberUpdated: boolean;
	updatedMemberProfile: MemberProfileFormValues;
	expectedMemberProfile: MemberProfileExpectation;
}

export interface MemberProfileFormValues {
	name: string;
	email: string;
	bio: string;
	showInterests: boolean;
	showEmail: boolean;
	showProfile: boolean;
	showLocation: boolean;
	showProperties: boolean;
}

export type MemberProfileExpectation = MemberProfileFormValues;
