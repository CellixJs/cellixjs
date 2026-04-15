import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { Route, Routes } from 'react-router-dom';
import { MenuComponent, type MenuComponentProps } from './menu-component.tsx';

const meta = {
	title: 'UI/Organisms/Navigation/MenuComponent/Display',
	component: MenuComponent,
} satisfies Meta<typeof MenuComponent>;

export default meta;
type Story = StoryObj<typeof MenuComponent>;

const baseLayouts: MenuComponentProps['pageLayouts'] = [
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
];

export const Default: Story = {
	args: {
		theme: 'light',
		mode: 'inline',
		pageLayouts: baseLayouts,
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.findByRole('link', { name: 'Home' })).resolves.toBeInTheDocument();
		await expect(canvas.findByRole('link', { name: 'Team' })).resolves.toBeInTheDocument();
	},
};

export const WithNestedSubMenu: Story = {
	args: {
		theme: 'light',
		mode: 'inline',
		pageLayouts: [
			...baseLayouts,
			{
				path: '/community/:communityId/member/:memberId/team/details',
				title: 'Team Details',
				icon: <span>D</span>,
				id: 'TEAM_DETAILS',
				parent: 'TEAM',
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const teamSubMenu = await canvas.findByText('Team');
		await userEvent.click(teamSubMenu);
		await expect(canvas.findByRole('link', { name: 'Team Details' })).resolves.toBeInTheDocument();
	},
};

export const RespectsPermissions: Story = {
	args: {
		theme: 'light',
		mode: 'inline',
		memberData: { role: 'member' },
		pageLayouts: [
			...baseLayouts,
			{
				path: '/community/:communityId/member/:memberId/admin',
				title: 'Admin',
				icon: <span>A</span>,
				id: 'ADMIN',
				parent: 'ROOT',
				hasPermissions: (member) => Boolean(member && typeof member === 'object' && 'role' in member && (member as { role?: string }).role === 'admin'),
			},
		],
	} satisfies MenuComponentProps,
	parameters: {
		memoryRouter: {
			initialEntries: ['/community/community-1/member/member-1'],
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.queryByRole('link', { name: 'Admin' })).toBeNull();
	},
};

export const WithoutRoot: Story = {
	args: {
		theme: 'light',
		mode: 'inline',
		pageLayouts: [
			{
				path: '/community/:communityId/member/:memberId/team',
				title: 'Team',
				icon: <span>T</span>,
				id: 'TEAM',
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.queryByRole('menu')).toBeNull();
	},
};
