import { App as AntdApp } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { AdminCommunityDetailContainerCommunityFieldsFragment, AdminSectionLayoutContainerMemberFieldsFragment } from '../generated.tsx';
import { AdminCommunityDetailContainerCommunityByIdDocument, AdminSectionLayoutContainerMembersForCurrentEndUserDocument } from '../generated.tsx';
import { CommunitiesDropdownContainerMembersForCurrentEndUserDocument } from '../../../ui-shared/src/generated.tsx';
import { Admin } from '../index.tsx';

const communityId = 'community-1';
const memberId = 'member-1';

const mockCommunity: AdminCommunityDetailContainerCommunityFieldsFragment = {
	__typename: 'Community',
	id: communityId,
	name: 'Test Community',
	domain: 'test.example.com',
	whiteLabelDomain: 'test',
	handle: 'test-community',
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
	title: 'Pages/Community/Admin/Home',
	component: Admin,
	decorators: [
		(Story) => (
			<AntdApp>
				<MemoryRouter initialEntries={[`/community/${communityId}/admin/${memberId}`]}>
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
						query: AdminCommunityDetailContainerCommunityByIdDocument,
						variables: {
							id: communityId,
						},
					},
					result: {
						data: {
							communityById: mockCommunity,
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
