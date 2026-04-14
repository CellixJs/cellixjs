import type { Meta, StoryObj } from '@storybook/react';
import { Route, Routes } from 'react-router-dom';
import { MenuComponent, type MenuComponentProps } from './menu-component.tsx';

const meta = {
	title: 'UI/Organisms/Navigation/MenuComponent/Display',
	component: MenuComponent,
} satisfies Meta<typeof MenuComponent>;

export default meta;
type Story = StoryObj<typeof MenuComponent>;

export const Default: Story = {
	args: {
		theme: 'light',
		mode: 'inline',
		pageLayouts: [
			{
				path: '/community/:communityId/member/:memberId',
				title: 'Home',
				icon: <span>H</span>,
				id: 'ROOT',
			},
			{
				path: '/community/:communityId/member/:memberId/team',
				title: 'Team',
				icon: <span>T</span>,
				id: 'TEAM',
				parent: 'ROOT',
			},
			{
				path: '/community/:communityId/member/:memberId/settings',
				title: 'Settings',
				icon: <span>S</span>,
				id: 'SETTINGS',
				parent: 'ROOT',
			},
		],
	} satisfies MenuComponentProps,
	parameters: {
		memoryRouter: {
			initialEntries: ['/community/community-1/member/member-1/team'],
		},
	},
	render: (args) => (
		<Routes>
			<Route
				path="/community/:communityId/member/:memberId/*"
				element={<MenuComponent {...args} />}
			/>
		</Routes>
	),
};
