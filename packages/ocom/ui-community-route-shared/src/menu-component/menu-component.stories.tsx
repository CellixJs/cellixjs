import { HomeOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';
import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { expect, within } from 'storybook/test';
import { MenuComponent, type PageLayoutProps } from './menu-component.tsx';

// Local mock type for stories — avoids importing from any generated.tsx
interface MockMember {
	__typename: 'Member';
	id: string;
	memberName: string;
	isAdmin?: boolean | null;
}

const TypedMenuComponent = MenuComponent<MockMember>;

const mockPageLayouts: PageLayoutProps<MockMember>[] = [
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

const mockMember: MockMember = {
	__typename: 'Member',
	id: 'member1',
	memberName: 'Test Member',
	isAdmin: true,
};

const meta = {
	title: 'Components/Layouts/Shared/MenuComponent',
	component: TypedMenuComponent,
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
} satisfies Meta<typeof TypedMenuComponent>;

export default meta;
type Story = StoryObj<typeof TypedMenuComponent>;

export const Default: Story = {
	args: {
		pageLayouts: mockPageLayouts,
		theme: 'light',
		mode: 'inline',
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

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
				hasPermissions: (member: MockMember) => member.isAdmin ?? false,
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
				hasPermissions: (member: MockMember) => member.isAdmin ?? false,
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
		expect(canvas.queryByText('Settings')).not.toBeInTheDocument();
		expect(canvas.getByText('Home')).toBeInTheDocument();
		expect(canvas.getByText('Members')).toBeInTheDocument();
	},
};
