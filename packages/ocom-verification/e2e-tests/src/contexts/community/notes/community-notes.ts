export interface CommunityE2ENotes {
	communityId: string | null;
	communityName: string;
	communityCreated: boolean;
	errorMessage: string | null;
	portalUser: 'owner' | 'member';
	memberId: string;
	settingsSaved: boolean;
	displayedCommunityName: string;
	savedWhiteLabelDomain: string;
	savedDomain: string;
	savedHandle: string;
}
