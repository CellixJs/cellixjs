import { HomeOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';
import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { expect, within } from 'storybook/test';
import type { Member } from '../../../../generated.tsx';
import { MenuComponent, type PageLayoutProps } from './menu-component.tsx';

const mockPageLayouts: PageLayoutProps[] = [
	{
		path: '',
		title: 'Home',
		icon: <HomeOutlined />,
		id: 'ROOT',
	},
	{
		path: 'settings/*',
		title: 'Settings',
		icon: <SettingOutlined />,
		id: 'settings',
		parent: 'ROOT',
	},
	{
		path: 'members/*',
		title: 'Members',
		icon: <TeamOutlined />,
		id: 'members',
		parent: 'ROOT',
	},
];

const mockMember: Member = {
	__typename: 'Member',
	id: 'member1',
	memberName: 'Test Member',
	isAdmin: true,
	community: {
		__typename: 'Community',
		id: 'community1',
		name: 'Test Community',
	} as Member['community'],
} as Member;

const meta = {
	title: 'Components/Layouts/Shared/MenuComponent',
	component: MenuComponent,
	parameters: {
		layout: 'padded',
	},
	decorators: [
		(Story) => (
			<BrowserRouter>
				<div style={{ width: '300px' }}>
					<Story />
				</div>
			</BrowserRouter>
		),
	],
} satisfies Meta<typeof MenuComponent>;

export default meta;
type Story = StoryObj<typeof MenuComponent>;

export const Default: Story = {
	args: {
		pageLayouts: mockPageLayouts,
		theme: 'light',
		mode: 'inline',
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify menu items are rendered
		expect(canvas.getByText('Home')).toBeInTheDocument();
		expect(canvas.getByText('Settings')).toBeInTheDocument();
		expect(canvas.getByText('Members')).toBeInTheDocument();
	},
};

export const DarkTheme: Story = {
	args: {
		pageLayouts: mockPageLayouts,
		theme: 'dark',
		mode: 'inline',
	},
};

export const HorizontalMode: Story = {
	args: {
		pageLayouts: mockPageLayouts,
		theme: 'light',
		mode: 'horizontal',
	},
};

export const WithMemberData: Story = {
	args: {
		pageLayouts: mockPageLayouts,
		theme: 'light',
		mode: 'inline',
		memberData: mockMember,
	},
};

export const WithPermissions: Story = {
	args: {
		pageLayouts: [
			{
				path: '',
				title: 'Home',
				icon: <HomeOutlined />,
				id: 'ROOT',
			},
			{
				path: 'settings/*',
				title: 'Settings',
				icon: <SettingOutlined />,
				id: 'settings',
				parent: 'ROOT',
				hasPermissions: (member: Member) => member.isAdmin ?? false,
			},
			{
				path: 'members/*',
				title: 'Members',
				icon: <TeamOutlined />,
				id: 'members',
				parent: 'ROOT',
			},
		],
		theme: 'light',
		mode: 'inline',
		memberData: mockMember,
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify admin-only menu item is visible for admin member
		expect(canvas.getByText('Settings')).toBeInTheDocument();
	},
};

export const NoPermissions: Story = {
	args: {
		pageLayouts: [
			{
				path: '',
				title: 'Home',
				icon: <HomeOutlined />,
				id: 'ROOT',
			},
			{
				path: 'settings/*',
				title: 'Settings',
				icon: <SettingOutlined />,
				id: 'settings',
				parent: 'ROOT',
				hasPermissions: (member: Member) => member.isAdmin ?? false,
			},
			{
				path: 'members/*',
				title: 'Members',
				icon: <TeamOutlined />,
				id: 'members',
				parent: 'ROOT',
			},
		],
		theme: 'light',
		mode: 'inline',
		memberData: {
			...mockMember,
			isAdmin: false,
		},
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify admin-only menu item is NOT visible for non-admin member
		expect(canvas.queryByText('Settings')).not.toBeInTheDocument();
		expect(canvas.getByText('Home')).toBeInTheDocument();
		expect(canvas.getByText('Members')).toBeInTheDocument();
	},
};
