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

export const MEMBER_UPDATE_PROFILE_MUTATION = `
  mutation MemberUpdateProfile($input: MemberUpdateProfileInput!) {
    memberUpdateProfile(input: $input) {
      status {
        success
        errorMessage
      }
      member {
        id
        profile {
          name
          email
          bio
          avatarDocumentId
          interests
          showInterests
          showEmail
          showProfile
          showLocation
          showProperties
        }
      }
    }
  }
`;

export const MEMBERS_FOR_CURRENT_END_USER_QUERY = `
  query MembersForCurrentEndUser {
    membersForCurrentEndUser {
      id
      community {
        id
      }
    }
  }
`;

export const MEMBERS_BY_COMMUNITY_QUERY = `
  query MembersByCommunity($communityId: ObjectID!) {
    membersByCommunityId(communityId: $communityId) {
      id
      memberName
    }
  }
`;

export const MEMBER_BY_ID_QUERY = `
  query MemberById($id: ObjectID!) {
    member(id: $id) {
      id
      memberName
      community {
        id
      }
      profile {
        name
        email
        bio
        avatarDocumentId
        interests
        showInterests
        showEmail
        showProfile
        showLocation
        showProperties
      }
    }
  }
`;
