import {
	AccountsCommunityListContainerCommunitiesForCurrentEndUserDocument,
	AccountsCommunityListContainerMembersForCurrentEndUserDocument,
	AccountsUserInfoContainerCurrentEndUserAndCreateIfNotExistsDocument,
} from '../../../packages/ocom/ui-community-route-accounts/src/generated';

// Mock data for communities
const mockCommunities = [
	{
		__typename: 'Community' as const,
		name: 'Sample Community 1',
		domain: 'sample1.example.com',
		whiteLabelDomain: null,
		handle: 'sample1',
		publicContentBlobUrl: 'https://example.com/content/sample1',
		schemaVersion: '1.0.0',
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z',
		id: 'community-1',
	},
	{
		__typename: 'Community' as const,
		name: 'Sample Community 2',
		domain: 'sample2.example.com',
		whiteLabelDomain: 'custom.sample2.com',
		handle: 'sample2',
		publicContentBlobUrl: 'https://example.com/content/sample2',
		schemaVersion: '1.0.0',
		createdAt: '2024-01-02T00:00:00Z',
		updatedAt: '2024-01-02T00:00:00Z',
		id: 'community-2',
	},
];

// Mock data for members
const mockMembers = [
	{
		__typename: 'Member' as const,
		memberName: 'John Doe',
		isAdmin: true,
		accounts: [],
		role: null,
		id: 'member-1',
		community: {
			__typename: 'Community' as const,
			id: 'community-1',
		},
	},
	{
		__typename: 'Member' as const,
		memberName: 'Jane Smith',
		isAdmin: false,
		accounts: [
			{
				__typename: 'MemberAccount' as const,
				statusCode: 'ACCEPTED',
				user: { __typename: 'EndUser' as const, id: 'enduser-1' },
			},
		],
		role: {
			__typename: 'EndUserRole' as const,
			id: 'role-property-manager',
			permissions: {
				__typename: 'EndUserRolePermissions' as const,
				propertyPermissions: {
					__typename: 'PropertyPermissions' as const,
					canManageProperties: true,
				},
			},
		},
		id: 'member-2',
		community: {
			__typename: 'Community' as const,
			id: 'community-1',
		},
	},
	{
		__typename: 'Member' as const,
		memberName: 'Bob Johnson',
		isAdmin: true,
		accounts: [],
		role: null,
		id: 'member-3',
		community: {
			__typename: 'Community' as const,
			id: 'community-2',
		},
	},
];

// Mock data for current end user
const mockCurrentEndUser = {
	__typename: 'EndUser' as const,
	externalId: 'user-123',
	id: 'enduser-1',
	personalInformation: {
		__typename: 'EndUserPersonalInformation' as const,
		identityDetails: {
			__typename: 'EndUserIdentityDetails' as const,
			lastName: 'Doe',
			restOfName: 'John',
		},
	},
};

// Apollo Client mocks for Storybook
export const apolloMocks = [
	{
		request: {
			query: AccountsCommunityListContainerCommunitiesForCurrentEndUserDocument,
		},
		result: {
			data: {
				communitiesForCurrentEndUser: mockCommunities,
			},
		},
	},
	{
		request: {
			query: AccountsCommunityListContainerMembersForCurrentEndUserDocument,
		},
		result: {
			data: {
				currentEndUserAndCreateIfNotExists: mockCurrentEndUser,
				membersForCurrentEndUser: mockMembers,
			},
		},
	},
	{
		request: {
			query: AccountsUserInfoContainerCurrentEndUserAndCreateIfNotExistsDocument,
		},
		result: {
			data: {
				currentEndUserAndCreateIfNotExists: mockCurrentEndUser,
			},
		},
	},
];
