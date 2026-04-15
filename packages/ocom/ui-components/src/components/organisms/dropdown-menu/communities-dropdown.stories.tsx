import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { Route, Routes } from 'react-router-dom';
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
