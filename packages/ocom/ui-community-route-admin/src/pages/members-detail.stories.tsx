import { App as AntdApp } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { AdminMembersDetailContainerMemberFieldsFragment, AdminSectionLayoutContainerMemberFieldsFragment } from '../generated.tsx';
import { AdminMembersDetailContainerMemberDocument, AdminSectionLayoutContainerMembersForCurrentEndUserDocument } from '../generated.tsx';
import { CommunitiesDropdownContainerMembersForCurrentEndUserDocument } from '../../../ui-shared/src/generated.tsx';
import { Admin } from '../index.tsx';

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

const meta = {
	title: 'Pages/Community/Admin/Members/Detail',
	component: Admin,
	decorators: [
		(Story) => (
			<AntdApp>
				<MemoryRouter initialEntries={[`/community/${communityId}/admin/${memberId}/members/${memberId}`]}>
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
					},
					result: {
						data: {
							membersForCurrentEndUser: mockSectionLayoutMembers,
						},
					},
				},
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
} satisfies Meta<typeof Admin>;

export default meta;
type Story = StoryObj<typeof Admin>;

export const Default: Story = {};
