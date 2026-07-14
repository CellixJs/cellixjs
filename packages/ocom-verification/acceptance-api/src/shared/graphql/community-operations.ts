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

export const CURRENT_END_USER_QUERY = `
	query CurrentEndUserAndCreateIfNotExists {
		currentEndUserAndCreateIfNotExists {
			id
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
