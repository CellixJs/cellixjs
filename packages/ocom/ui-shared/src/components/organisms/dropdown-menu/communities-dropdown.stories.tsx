import type { Meta, StoryObj } from '@storybook/react-vite';
import { Route, Routes } from 'react-router-dom';
import { expect, userEvent, within } from 'storybook/test';
import { CommunitiesDropdown, type CommunitiesDropdownProps } from './communities-dropdown.tsx';

const meta = {
	title: 'UI/Organisms/DropdownMenu/CommunitiesDropdown/Display',
	component: CommunitiesDropdown,
} satisfies Meta<typeof CommunitiesDropdown>;

export default meta;
type Story = StoryObj<typeof CommunitiesDropdown>;

const members: CommunitiesDropdownProps['data']['members'] = [
	{
		id: 'member-1',
		memberName: 'Alice',
		isAdmin: true,
		community: {
			id: 'community-1',
			name: 'Community One',
		},
	},
	{
		id: 'member-2',
		memberName: 'Bob',
		isAdmin: false,
		community: {
			id: 'community-1',
			name: 'Community One',
		},
	},
	{
		id: 'member-3',
		memberName: 'Charlie',
		isAdmin: false,
		community: {
			id: 'community-2',
			name: 'Community Two',
		},
	},
];

export const Default: Story = {
	args: {
		data: {
			members,
		},
	} satisfies CommunitiesDropdownProps,
	parameters: {
		memoryRouter: {
			initialEntries: ['/community/community-1/member/member-1'],
		},
	},
	render: (args) => (
		<Routes>
			<Route
				path="/community/:communityId/member/:memberId"
				element={<CommunitiesDropdown {...args} />}
			/>
		</Routes>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const trigger = await canvas.findByRole('button', { name: /community one \| alice/i });
		await userEvent.click(trigger);
		await expect(canvas.getByRole('button', { name: /community one \| alice/i })).toBeInTheDocument();
	},
};

export const SelectMemberPath: Story = {
	args: {
		data: {
			members,
		},
	} satisfies CommunitiesDropdownProps,
	parameters: {
		memoryRouter: {
			initialEntries: ['/community/community-1/member/member-1'],
		},
	},
	render: (args) => (
		<Routes>
			<Route
				path="/community/:communityId/member/:memberId"
				element={<CommunitiesDropdown {...args} />}
			/>
		</Routes>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const trigger = await canvas.findByRole('button', { name: /community one \| alice/i });
		await userEvent.click(trigger);
		await expect(canvas.getByRole('button', { name: /community one \| alice/i })).toBeInTheDocument();
	},
};

export const SkipMembersWithoutCommunity: Story = {
	args: {
		data: {
			members: [
				{
					id: 'member-without-community',
					memberName: 'No Community',
					isAdmin: false,
					community: {
						id: null,
						name: null,
					},
				},
				...members,
			],
		},
	} satisfies CommunitiesDropdownProps,
	parameters: {
		memoryRouter: {
			initialEntries: ['/community/community-1/member/member-1'],
		},
	},
	render: (args) => (
		<Routes>
			<Route
				path="/community/:communityId/member/:memberId"
				element={<CommunitiesDropdown {...args} />}
			/>
		</Routes>
	),
};

export const PropertyManagerCanOpenAdminPortal: Story = {
	args: {
		data: {
			currentEndUserId: 'enduser-1',
			members: [
				{
					id: 'member-manager',
					memberName: 'Pat Manager',
					// The backend derives isAdmin from canManageProperties itself
					isAdmin: true,
					accounts: [{ statusCode: 'ACCEPTED', user: { id: 'enduser-1' } }],
					role: { permissions: { propertyPermissions: { canManageProperties: true } } },
					community: { id: 'community-1', name: 'Community One' },
				},
				{
					id: 'member-pending',
					memberName: 'Sam Pending',
					// isAdmin from canManageProperties must not bypass the ACCEPTED-account requirement
					isAdmin: true,
					accounts: [{ statusCode: 'CREATED', user: { id: 'enduser-1' } }],
					role: { permissions: { propertyPermissions: { canManageProperties: true } } },
					community: { id: 'community-1', name: 'Community One' },
				},
			],
		},
	} satisfies CommunitiesDropdownProps,
	parameters: {
		memoryRouter: {
			initialEntries: ['/community/community-1/member/member-manager'],
		},
	},
	render: (args) => (
		<Routes>
			<Route
				path="/community/:communityId/member/:memberId"
				element={<CommunitiesDropdown {...args} />}
			/>
		</Routes>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);
		const trigger = await canvas.findByRole('button', { name: /community one \| pat manager/i });
		await userEvent.hover(trigger);

		// Members are grouped in a submenu per community
		const communityItem = await body.findByText('Community One');
		await userEvent.hover(communityItem);

		// A non-admin property manager with an accepted account gets an admin portal entry
		await expect(await body.findByText('Pat Manager (Admin)')).toBeInTheDocument();
		// A property manager without an accepted account does not
		expect(body.queryByText('Sam Pending (Admin)')).not.toBeInTheDocument();
	},
};
