import { App as AntdApp } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { AdminMemberListContainerMemberFieldsFragment } from '../generated.tsx';
import { AdminMemberListContainerMembersDocument } from '../generated.tsx';
import { Members } from './members.tsx';

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

const meta = {
	title: 'Pages/Community/Admin/Members',
	component: Members,
	decorators: [
		(Story) => (
			<AntdApp>
				<MemoryRouter initialEntries={[`/community/${communityId}/admin/${memberId}/members`]}>
					<Routes>
						<Route
							path="/community/:communityId/admin/:memberId/members/*"
							element={<Story />}
						/>
					</Routes>
				</MemoryRouter>
			</AntdApp>
		),
	],
	parameters: {
		apolloClient: {
			mocks: [
				{
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
				},
			],
		},
	},
} satisfies Meta<typeof Members>;

export default meta;
type Story = StoryObj<typeof Members>;

export const Default: Story = {};
