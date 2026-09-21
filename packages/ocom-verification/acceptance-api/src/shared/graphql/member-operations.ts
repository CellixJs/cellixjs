export interface MemberResult {
	id: string;
	memberName?: string | null;
}

export const MEMBER_CREATE_MUTATION = `
	mutation MemberCreate($input: MemberCreateInput!) {
		memberCreate(input: $input) {
			status {
				success
				errorMessage
			}
			member {
				id
				memberName
			}
		}
	}
`;

export const MEMBERS_BY_COMMUNITY_QUERY = `
	query MembersByCommunityId($communityId: ObjectID!) {
		membersByCommunityId(communityId: $communityId) {
			id
			memberName
		}
	}
`;
