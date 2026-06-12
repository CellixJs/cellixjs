import { App as AntdApp } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { AdminCommunityDetailContainerCommunityFieldsFragment } from '../generated.tsx';
import { AdminCommunityDetailContainerCommunityByIdDocument } from '../generated.tsx';
import { Home } from './home.tsx';

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

const meta = {
	title: 'Pages/Community/Admin/Home',
	component: Home,
	decorators: [
		(Story) => (
			<AntdApp>
				<MemoryRouter initialEntries={[`/community/${communityId}/admin/${memberId}`]}>
					<Routes>
						<Route
							path="/community/:communityId/admin/:memberId"
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
} satisfies Meta<typeof Home>;

export default meta;
type Story = StoryObj<typeof Home>;

export const Default: Story = {};
