import { App as AntdApp } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { AdminSettingsGeneralContainerCommunityFieldsFragment } from '../generated.tsx';
import { AdminSettingsGeneralContainerCurrentCommunityDocument } from '../generated.tsx';
import { Settings } from './settings.tsx';

const communityId = 'community-1';
const memberId = 'member-1';

const mockCommunity: AdminSettingsGeneralContainerCommunityFieldsFragment = {
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
	title: 'Pages/Community/Admin/Settings',
	component: Settings,
	decorators: [
		(Story) => (
			<AntdApp>
				<MemoryRouter initialEntries={[`/community/${communityId}/admin/${memberId}/settings`]}>
					<Routes>
						<Route
							path="/community/:communityId/admin/:memberId/settings/*"
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
						query: AdminSettingsGeneralContainerCurrentCommunityDocument,
					},
					result: {
						data: {
							currentCommunity: mockCommunity,
						},
					},
				},
			],
		},
	},
} satisfies Meta<typeof Settings>;

export default meta;
type Story = StoryObj<typeof Settings>;

export const Default: Story = {};
