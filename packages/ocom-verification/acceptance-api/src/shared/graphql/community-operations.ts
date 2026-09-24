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

export const COMMUNITY_UPDATE_SETTINGS_MUTATION = `
	mutation CommunityUpdateSettings($input: CommunityUpdateSettingsInput!) {
		communityUpdateSettings(input: $input) {
			status {
				success
				errorMessage
			}
			community {
				id
				name
				domain
				whiteLabelDomain
				handle
			}
		}
	}
`;

export const GET_COMMUNITY_QUERY = `
	query CommunityById($id: ObjectID!) {
		communityById(id: $id) {
			id
			name
			domain
			whiteLabelDomain
			handle
		}
	}
`;

export const CURRENT_COMMUNITY_QUERY = `
	query CurrentCommunity {
		currentCommunity {
			id
			name
			domain
			whiteLabelDomain
			handle
		}
	}
`;
