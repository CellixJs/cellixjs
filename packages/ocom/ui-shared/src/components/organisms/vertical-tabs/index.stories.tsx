import { HomeOutlined, ProfileOutlined, SettingOutlined } from '@ant-design/icons';
import type { Meta, StoryObj } from '@storybook/react';
import { Route, Routes } from 'react-router-dom';
import { VerticalTabs } from './index.tsx';

const meta: Meta<typeof VerticalTabs> = {
	title: 'UI/Organisms/VerticalTabs',
	component: VerticalTabs,
};

export default meta;
type Story = StoryObj<typeof VerticalTabs>;

export const Default: Story = {
	args: {
		pages: [
			{
				id: '1',
				link: '',
				path: '',
				title: 'Home',
				icon: <HomeOutlined />,
				element: <div>Home Content</div>,
			},
			{
				id: '2',
				link: 'profile',
				path: 'profile/*',
				title: 'Profile',
				icon: <ProfileOutlined />,
				element: <div>Profile Content</div>,
			},
			{
				id: '3',
				link: 'settings',
				path: 'settings/*',
				title: 'Settings',
				icon: <SettingOutlined />,
				element: <div>Settings Content</div>,
			},
		],
	},
	parameters: {
		memoryRouter: {
			initialEntries: ['/'],
		},
	},
	render: (args) => (
		<Routes>
			<Route
				path="/*"
				element={<VerticalTabs {...args} />}
			/>
		</Routes>
	),
};
