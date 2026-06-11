import { App as AntdApp } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MembersCreate } from './members-create.tsx';

const communityId = 'community-1';
const memberId = 'member-1';

const meta = {
	title: 'Pages/Community/Admin/Members/Create',
	component: MembersCreate,
	decorators: [
		(Story) => (
			<AntdApp>
				<MemoryRouter initialEntries={[`/community/${communityId}/admin/${memberId}/members/create`]}>
					<Routes>
						<Route
							path="/community/:communityId/admin/:memberId/members/create"
							element={<Story />}
						/>
					</Routes>
				</MemoryRouter>
			</AntdApp>
		),
	],
} satisfies Meta<typeof MembersCreate>;

export default meta;
type Story = StoryObj<typeof MembersCreate>;

export const Default: Story = {};
