import { App as AntdApp } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { AdminMembersAccountsListContainerMemberFieldsFragment } from '../generated.tsx';
import { AdminMembersAccountsListContainerMemberDocument } from '../generated.tsx';
import { MembersAccounts } from './members-accounts.tsx';

const communityId = 'community-1';
const memberId = 'member-1';

const mockMember: AdminMembersAccountsListContainerMemberFieldsFragment = {
	__typename: 'Member',
	id: memberId,
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
				personalInformation: {
					__typename: 'EndUserPersonalInformation',
					contactInformation: {
						__typename: 'EndUserContactInformation',
						email: 'john.doe@example.com',
					},
				},
			},
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-02T00:00:00.000Z',
		},
	],
};

const meta = {
	title: 'Pages/Community/Admin/Members/Accounts',
	component: MembersAccounts,
	decorators: [
		(Story) => (
			<AntdApp>
				<MemoryRouter initialEntries={[`/community/${communityId}/admin/${memberId}/members/${memberId}/accounts`]}>
					<Routes>
						<Route
							path="/community/:communityId/admin/:memberId/members/:id/accounts/*"
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
						query: AdminMembersAccountsListContainerMemberDocument,
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
} satisfies Meta<typeof MembersAccounts>;

export default meta;
type Story = StoryObj<typeof MembersAccounts>;

export const Default: Story = {};
