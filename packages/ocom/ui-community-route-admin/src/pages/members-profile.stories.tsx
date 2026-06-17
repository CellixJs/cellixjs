import { App as AntdApp } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { SharedMemberProfileContainerMemberFieldsFragment } from '../../../ui-community-shared/src/generated.tsx';
import { SharedMemberProfileContainerMemberDocument } from '../../../ui-community-shared/src/generated.tsx';
import { MembersProfile } from './members-profile.tsx';

const communityId = 'community-1';
const memberId = 'member-1';

const mockMember: SharedMemberProfileContainerMemberFieldsFragment = {
	id: memberId,
	memberName: 'John Doe',
	profile: {
		name: 'John Doe',
		email: 'john.doe@example.com',
		bio: 'Admin member',
		showInterests: true,
		showEmail: true,
		showProfile: true,
		showLocation: false,
		showProperties: true,
	},
	createdAt: '2024-01-01T00:00:00.000Z',
	updatedAt: '2024-01-02T00:00:00.000Z',
};

const meta = {
	title: 'Pages/Community/Admin/Members/Profile',
	component: MembersProfile,
	decorators: [
		(Story) => (
			<AntdApp>
				<MemoryRouter initialEntries={[`/community/${communityId}/admin/${memberId}/members/${memberId}/profile`]}>
					<Routes>
						<Route
							path="/community/:communityId/admin/:memberId/members/:id/profile"
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
						query: SharedMemberProfileContainerMemberDocument,
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
} satisfies Meta<typeof MembersProfile>;

export default meta;
type Story = StoryObj<typeof MembersProfile>;

export const Default: Story = {};
