export const COMMUNITY_CREATE_MUTATION = `
	mutation CommunityCreate($input: CommunityCreateInput!) {
		communityCreate(input: $input) {
			status {
				success
				errorMessage
			}
			community {
				id
				name
			}
		}
	}
`;

export const GET_COMMUNITY_QUERY = `
	query CommunityById($id: ObjectID!) {
		communityById(id: $id) {
			id
			name
		}
	}
`;
