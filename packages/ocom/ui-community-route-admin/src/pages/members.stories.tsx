import { App as AntdApp } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { AdminMemberListContainerMemberFieldsFragment, AdminSectionLayoutContainerMemberFieldsFragment } from '../generated.tsx';
import { AdminMemberListContainerMembersDocument, AdminSectionLayoutContainerMembersForCurrentEndUserDocument } from '../generated.tsx';
import { CommunitiesDropdownContainerMembersForCurrentEndUserDocument } from '../../../ui-shared/src/generated.tsx';
import { Admin } from '../index.tsx';

const communityId = 'community-1';
const memberId = 'member-1';

const mockMembers: AdminMemberListContainerMemberFieldsFragment[] = [
	{
		__typename: 'Member',
		id: 'member-1',
		memberName: 'John Doe',
		isAdmin: true,
		accounts: [
			{
				__typename: 'MemberAccount',
				id: 'account-1',
				firstName: 'John',
				lastName: 'Doe',
				statusCode: 'ACCEPTED',
				user: {
					__typename: 'EndUser',
					id: 'user-1',
					externalId: 'auth0|user-1',
				},
				createdAt: '2024-01-01T00:00:00.000Z',
				updatedAt: '2024-01-02T00:00:00.000Z',
			},
		],
		profile: {
			__typename: 'MemberProfile',
			name: 'John Doe',
			email: 'john.doe@example.com',
			bio: 'Admin member',
			showEmail: true,
			showProfile: true,
		},
		createdAt: '2024-01-01T00:00:00.000Z',
		updatedAt: '2024-01-02T00:00:00.000Z',
	},
];

const mockSectionLayoutMembers: AdminSectionLayoutContainerMemberFieldsFragment[] = [
	{
		__typename: 'Member',
		id: memberId,
		memberName: 'John Doe',
		isAdmin: true,
		community: {
			__typename: 'Community',
			id: communityId,
			name: 'Test Community',
		},
	},
];

const adminMemberListMock = {
	request: {
		query: AdminMemberListContainerMembersDocument,
		variables: {
			communityId,
		},
	},
	result: {
		data: {
			membersByCommunityId: mockMembers,
			memberForCurrentCommunity: {
				__typename: 'Member',
				id: memberId,
			},
		},
	},
};

const meta = {
	title: 'Pages/Community/Admin/Members',
	component: Admin,
	decorators: [
		(Story) => (
			<AntdApp>
				<MemoryRouter initialEntries={[`/community/${communityId}/admin/${memberId}/members`]}>
					<Routes>
						<Route
							path="/community/:communityId/admin/:memberId/*"
							element={<Story />}
						/>
					</Routes>
				</MemoryRouter>
			</AntdApp>
		),
	],
	parameters: {
		layout: 'fullscreen',
		apolloClient: {
			mocks: [
				{
					request: {
						query: AdminSectionLayoutContainerMembersForCurrentEndUserDocument,
					},
					result: {
						data: {
							membersForCurrentEndUser: mockSectionLayoutMembers,
						},
					},
				},
				{
					request: {
						query: CommunitiesDropdownContainerMembersForCurrentEndUserDocument,
						variables: {},
					},
					result: {
						data: {
							membersForCurrentEndUser: mockSectionLayoutMembers,
						},
					},
				},
				adminMemberListMock,
				adminMemberListMock,
				adminMemberListMock,
			],
		},
	},
} satisfies Meta<typeof Admin>;

export default meta;
type Story = StoryObj<typeof Admin>;

export const Default: Story = {};
