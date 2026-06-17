import { App as AntdApp } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { AdminMembersDetailContainerMemberFieldsFragment } from '../generated.tsx';
import { AdminMembersDetailContainerMemberDocument } from '../generated.tsx';
import { MembersDetail } from './members-detail.tsx';

const communityId = 'community-1';
const memberId = 'member-1';

const mockMember: AdminMembersDetailContainerMemberFieldsFragment = {
	__typename: 'Member',
	id: memberId,
	memberName: 'John Doe',
	role: {
		__typename: 'EndUserRole',
		id: 'role-1',
		roleName: 'Admin',
	},
	createdAt: '2024-01-01T00:00:00.000Z',
	updatedAt: '2024-01-02T00:00:00.000Z',
};

const meta = {
	title: 'Pages/Community/Admin/Members/Detail',
	component: MembersDetail,
	decorators: [
		(Story) => (
			<AntdApp>
				<MemoryRouter initialEntries={[`/community/${communityId}/admin/${memberId}/members/${memberId}`]}>
					<Routes>
						<Route
							path="/community/:communityId/admin/:memberId/members/:id/*"
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
						query: AdminMembersDetailContainerMemberDocument,
						variables: {
							id: memberId,
						},
					},
					result: {
						data: {
							member: mockMember,
						},
					},
				},
			],
		},
	},
} satisfies Meta<typeof MembersDetail>;

export default meta;
type Story = StoryObj<typeof MembersDetail>;

export const Default: Story = {};
