import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { BrowserRouter } from 'react-router-dom';
import type { AdminMembersAccountsListContainerMemberAccountFieldsFragment } from '../../../../generated.tsx';
import { MembersAccountsList } from './members-accounts-list.tsx';

const mockAccounts: AdminMembersAccountsListContainerMemberAccountFieldsFragment[] =
	[
		{
			id: '1',
			firstName: 'John',
			lastName: 'Doe',
			statusCode: 'Active',
			createdAt: '2024-01-01T12:00:00.000Z',
			updatedAt: '2024-01-15T12:00:00.000Z',
		},
		{
			id: '2',
			firstName: 'Jane',
			lastName: 'Smith',
			statusCode: 'Pending',
			createdAt: '2024-01-05T12:00:00.000Z',
			updatedAt: '2024-01-20T12:00:00.000Z',
		},
		{
			id: '3',
			firstName: 'Bob',
			lastName: 'Johnson',
			statusCode: 'Active',
			createdAt: '2024-01-10T12:00:00.000Z',
			updatedAt: '2024-01-25T12:00:00.000Z',
		},
	];

const meta: Meta<typeof MembersAccountsList> = {
	title: 'Components/Layouts/Admin/MembersAccountsList',
	component: MembersAccountsList,
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
};

export default meta;
type Story = StoryObj<typeof MembersAccountsList>;

export const Default: Story = {
	args: {
		data: mockAccounts,
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify add button is present
		expect(canvas.getByRole('button', { name: /Add Account/i })).toBeInTheDocument();

		// Verify table headers
		expect(canvas.getByText('Action')).toBeInTheDocument();
		expect(canvas.getByText('First Name')).toBeInTheDocument();
		expect(canvas.getByText('Last Name')).toBeInTheDocument();
		expect(canvas.getByText('Status')).toBeInTheDocument();
		expect(canvas.getByText('Created')).toBeInTheDocument();
		expect(canvas.getByText('Updated')).toBeInTheDocument();

		// Verify data is rendered
		expect(canvas.getByText('John')).toBeInTheDocument();
		expect(canvas.getByText('Doe')).toBeInTheDocument();
		expect(canvas.getByText('Active')).toBeInTheDocument();
	},
};

export const Empty: Story = {
	args: {
		data: [],
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify add button is present
		expect(canvas.getByRole('button', { name: /Add Account/i })).toBeInTheDocument();

		// Verify empty state message
		expect(canvas.getByText(/No data/i)).toBeInTheDocument();
	},
};

export const SingleAccount: Story = {
	args: {
		data: mockAccounts.slice(0, 1),
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify single account is rendered
		expect(canvas.getByText('John')).toBeInTheDocument();
		expect(canvas.getByText('Doe')).toBeInTheDocument();

		// Verify only one edit button
		const editButtons = canvas.getAllByRole('button', { name: 'Edit' });
		expect(editButtons).toHaveLength(1);
	},
};
