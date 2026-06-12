import { HomeOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';
import { MockedProvider } from '@apollo/client/testing';
import type { PageLayoutProps } from '@ocom/ui-shared';
import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, within } from 'storybook/test';
import type { Member } from './generated.tsx';
import type { AdminStaffSectionPermissions } from './section-layout.tsx';
import { SectionLayout } from './section-layout.tsx';

const mockMember: Member = {
	__typename: 'Member',
	id: '507f1f77bcf86cd799439011',
	memberName: 'John Doe',
	isAdmin: true,
	accounts: [],
	community: {
		__typename: 'Community',
		id: '507f1f77bcf86cd799439001',
		name: 'Test Community',
	},
	createdAt: '2024-01-01T12:00:00.000Z',
	updatedAt: '2024-01-01T12:00:00.000Z',
};

const allPermissions: AdminStaffSectionPermissions = {
	canManageCommunities: true,
	canManageUsers: true,
	canManageFinance: true,
	canManageTechAdmin: true,
};

const noPermissions: AdminStaffSectionPermissions = {
	canManageCommunities: false,
	canManageUsers: false,
	canManageFinance: false,
	canManageTechAdmin: false,
};

const makePageLayouts = (permissions: AdminStaffSectionPermissions | null): PageLayoutProps[] => [
	{
		path: '/community/:communityId/admin/:memberId',
		title: 'Home',
		icon: <HomeOutlined />,
		id: 'ROOT',
	},
	{
		path: '/community/:communityId/admin/:memberId/members/*',
		title: 'Members',
		icon: <TeamOutlined />,
		id: 2,
		parent: 'ROOT',
		hasPermissions: () => permissions?.canManageUsers ?? false,
	},
	{
		path: '/community/:communityId/admin/:memberId/settings/*',
		title: 'Settings',
		icon: <SettingOutlined />,
		id: 3,
		parent: 'ROOT',
		hasPermissions: () => permissions?.canManageCommunities ?? false,
	},
];

const meta: Meta<typeof SectionLayout> = {
	title: 'Components/Community/Layouts/SectionLayout',
	component: SectionLayout,
	decorators: [
		(Story) => (
			<MockedProvider
				mocks={[]}
				addTypename={false}
			>
				<MemoryRouter initialEntries={['/community/comm-1/admin/member-1']}>
					<Routes>
						<Route
							path="/community/:communityId/admin/:memberId"
							element={<Story />}
						/>
					</Routes>
				</MemoryRouter>
			</MockedProvider>
		),
	],
	parameters: {
		layout: 'fullscreen',
	},
};

export default meta;
type Story = StoryObj<typeof SectionLayout>;

export const AllPermissions: Story = {
	args: {
		pageLayouts: makePageLayouts(allPermissions),
		memberData: mockMember,
		staffSectionPermissions: allPermissions,
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		expect(canvas.getByText('Home')).toBeInTheDocument();
		expect(canvas.getByText('Members')).toBeInTheDocument();
		expect(canvas.getByText('Settings')).toBeInTheDocument();
	},
};

export const NoPermissions: Story = {
	args: {
		pageLayouts: makePageLayouts(noPermissions),
		memberData: mockMember,
		staffSectionPermissions: noPermissions,
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		expect(canvas.getByText('Home')).toBeInTheDocument();
		expect(canvas.queryByText('Members')).not.toBeInTheDocument();
		expect(canvas.queryByText('Settings')).not.toBeInTheDocument();
	},
};

export const CommunityPermissionsOnly: Story = {
	args: {
		pageLayouts: makePageLayouts({ ...noPermissions, canManageCommunities: true }),
		memberData: mockMember,
		staffSectionPermissions: { ...noPermissions, canManageCommunities: true },
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		expect(canvas.getByText('Home')).toBeInTheDocument();
		expect(canvas.queryByText('Members')).not.toBeInTheDocument();
		expect(canvas.getByText('Settings')).toBeInTheDocument();
	},
};

export const UserPermissionsOnly: Story = {
	args: {
		pageLayouts: makePageLayouts({ ...noPermissions, canManageUsers: true }),
		memberData: mockMember,
		staffSectionPermissions: { ...noPermissions, canManageUsers: true },
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		expect(canvas.getByText('Home')).toBeInTheDocument();
		expect(canvas.getByText('Members')).toBeInTheDocument();
		expect(canvas.queryByText('Settings')).not.toBeInTheDocument();
	},
};

export const NullPermissions: Story = {
	args: {
		pageLayouts: makePageLayouts(null),
		memberData: mockMember,
		staffSectionPermissions: null,
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		expect(canvas.getByText('Home')).toBeInTheDocument();
		expect(canvas.queryByText('Members')).not.toBeInTheDocument();
		expect(canvas.queryByText('Settings')).not.toBeInTheDocument();
	},
};
