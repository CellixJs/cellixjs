import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { BrowserRouter } from 'react-router-dom';
import type { AdminMembersListContainerMemberFieldsFragment } from '../../../../generated.tsx';
import { MembersList } from './members-list.tsx';

const mockMembers: AdminMembersListContainerMemberFieldsFragment[] = [
	{
		__typename: 'Member',
		id: '1',
		memberName: 'John Doe',
		isAdmin: true,
		createdAt: '2024-01-01T00:00:00.000Z',
		updatedAt: '2024-01-15T00:00:00.000Z',
	},
	{
		__typename: 'Member',
		id: '2',
		memberName: 'Jane Smith',
		isAdmin: false,
		createdAt: '2024-01-05T00:00:00.000Z',
		updatedAt: '2024-01-20T00:00:00.000Z',
	},
	{
		__typename: 'Member',
		id: '3',
		memberName: 'Bob Johnson',
		isAdmin: true,
		createdAt: '2024-01-10T00:00:00.000Z',
		updatedAt: '2024-01-25T00:00:00.000Z',
	},
];

const meta = {
	title: 'Components/Layouts/Admin/MembersList',
	component: MembersList,
	decorators: [
		(Story) => (
			<BrowserRouter>
				<Story />
			</BrowserRouter>
		),
	],
	parameters: {
		layout: 'padded',
	},
} satisfies Meta<typeof MembersList>;

export default meta;
type Story = StoryObj<typeof MembersList>;

export const Default: Story = {
	args: {
		data: mockMembers,
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify table is rendered
		expect(canvas.getByRole('table')).toBeInTheDocument();

		// Verify column headers
		expect(canvas.getByText('Action')).toBeInTheDocument();
		expect(canvas.getByText('Member')).toBeInTheDocument();
		expect(canvas.getByText('Is Admin')).toBeInTheDocument();
		expect(canvas.getByText('Updated')).toBeInTheDocument();
		expect(canvas.getByText('Created')).toBeInTheDocument();

		// Verify member data is displayed
		expect(canvas.getByText('John Doe')).toBeInTheDocument();
		expect(canvas.getByText('Jane Smith')).toBeInTheDocument();
		expect(canvas.getByText('Bob Johnson')).toBeInTheDocument();

		// Verify admin status
		const yesTexts = canvas.getAllByText('Yes');
		expect(yesTexts).toHaveLength(2); // John and Bob are admins

		// Verify dates are formatted correctly
		expect(canvas.getByText('01/01/2024')).toBeInTheDocument();
		expect(canvas.getByText('01/15/2024')).toBeInTheDocument();
	},
};

export const Empty: Story = {
	args: {
		data: [],
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify table is rendered but with no data rows
		expect(canvas.getByRole('table')).toBeInTheDocument();
		
		// Verify empty state message (in the ant-empty-description div, not the SVG title)
		const emptyDescription = canvas.getByText('No data', { selector: '.ant-empty-description' });
		expect(emptyDescription).toBeInTheDocument();
	},
};

export const SingleMember: Story = {
	args: {
		data: mockMembers.slice(0, 1),
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify only one member is displayed
		expect(canvas.getByText('John Doe')).toBeInTheDocument();
		expect(canvas.queryByText('Jane Smith')).not.toBeInTheDocument();

		// Verify Edit button is present
		expect(canvas.getByRole('button', { name: /edit/i })).toBeInTheDocument();
	},
};
