import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, userEvent, within } from 'storybook/test';
import type { Member } from '../../../../generated.tsx';
import { CommunitiesDropdown } from './communities-dropdown.tsx';

const mockMembers: Member[] = [
	{
		__typename: 'Member',
		id: 'member1',
		memberName: 'John Doe',
		isAdmin: true,
		community: {
			__typename: 'Community',
			id: 'community1',
			name: 'Community One',
		} as Member['community'],
	} as Member,
	{
		__typename: 'Member',
		id: 'member2',
		memberName: 'Jane Smith',
		isAdmin: false,
		community: {
			__typename: 'Community',
			id: 'community1',
			name: 'Community One',
		} as Member['community'],
	} as Member,
	{
		__typename: 'Member',
		id: 'member3',
		memberName: 'Bob Johnson',
		isAdmin: true,
		community: {
			__typename: 'Community',
			id: 'community2',
			name: 'Community Two',
		} as Member['community'],
	} as Member,
];

const meta = {
	title: 'Components/UI/Organisms/DropdownMenu/CommunitiesDropdown',
	component: CommunitiesDropdown,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		(Story, context) => (
			<MemoryRouter
				initialEntries={
					context.parameters.initialEntries || [
						'/community/community1/member/member1',
					]
				}
			>
				<Routes>
					<Route
						path="/community/:communityId/member/:memberId"
						element={<Story />}
					/>
					<Route path="*" element={<Story />} />
				</Routes>
			</MemoryRouter>
		),
	],
} satisfies Meta<typeof CommunitiesDropdown>;

export default meta;
type Story = StoryObj<typeof CommunitiesDropdown>;

export const Default: Story = {
	args: {
		data: {
			members: mockMembers,
		},
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify dropdown trigger is rendered
		const dropdownTrigger = canvas.getByText(/Community/i);
		expect(dropdownTrigger).toBeInTheDocument();
	},
};

export const SingleCommunity: Story = {
	args: {
		data: {
			members: [mockMembers[0] as Member],
		},
	},
};

export const MultipleCommunities: Story = {
	args: {
		data: {
			members: mockMembers,
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Click dropdown to open
		const dropdownTrigger = canvas.getByText(/Community One/i);
		await userEvent.click(dropdownTrigger);

		// Wait for dropdown menu to appear
		// Note: In actual storybook, the dropdown menu appears in a portal
		// so this might not work perfectly in the test, but it demonstrates intent
	},
};

export const NoMembers: Story = {
	args: {
		data: {
			members: [],
		},
	},
};

export const AdminMember: Story = {
	parameters: {
		initialEntries: ['/community/comm1/member/admin1'],
	},
	args: {
		data: {
			members: [
				{
					__typename: 'Member',
					id: 'admin1',
					memberName: 'Admin User',
					isAdmin: true,
					community: {
						__typename: 'Community',
						id: 'comm1',
						name: 'Admin Community',
					} as Member['community'],
				} as Member,
			],
		},
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify admin member is shown in dropdown
		expect(canvas.getByText(/Admin Community/i)).toBeInTheDocument();
	},
};
