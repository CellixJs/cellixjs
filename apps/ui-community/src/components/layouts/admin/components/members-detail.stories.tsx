import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import type { AdminMembersDetailContainerMemberFieldsFragment } from '../../../../generated.tsx';
import { MembersDetail } from './members-detail.tsx';

const mockMember: AdminMembersDetailContainerMemberFieldsFragment = {
	__typename: 'Member',
	id: '507f1f77bcf86cd799439011',
	memberName: 'John Doe',
	createdAt: '2024-01-01T12:00:00.000Z',
	updatedAt: '2024-01-15T12:00:00.000Z',
};

const meta: Meta<typeof MembersDetail> = {
	title: 'Components/Layouts/Admin/MembersDetail',
	component: MembersDetail,
	parameters: {
		layout: 'padded',
	},
};

export default meta;
type Story = StoryObj<typeof MembersDetail>;

const mockOnSave = fn();

export const Default: Story = {
	args: {
		data: {
			member: mockMember,
		},
		onSave: mockOnSave,
		loading: false,
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify member info is displayed
		expect(canvas.getByText(mockMember.id)).toBeInTheDocument();
		expect(canvas.getByText('01/01/2024')).toBeInTheDocument();
		expect(canvas.getByText('01/15/2024')).toBeInTheDocument();

		// Verify form is rendered with correct value
		const input = canvas.getByLabelText('Member Name') as HTMLInputElement;
		expect(input.value).toBe(mockMember.memberName);
	},
};

export const Loading: Story = {
	args: {
		data: {
			member: mockMember,
		},
		onSave: mockOnSave,
		loading: true,
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify loading state - button text is still present but button has loading class
		const button = canvas.getByText('Save').closest('button');
		expect(button).toHaveClass('ant-btn-loading');
	},
};

export const FormSubmission: Story = {
	args: {
		data: {
			member: mockMember,
		},
		onSave: mockOnSave,
		loading: false,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Update the member name
		const input = canvas.getByLabelText('Member Name');
		await userEvent.clear(input);
		await userEvent.type(input, 'Updated Name');

		// Submit the form
		const submitButton = canvas.getByRole('button', { name: 'Save' });
		await userEvent.click(submitButton);

		// Verify onSave was called with correct data
		expect(mockOnSave).toHaveBeenCalledWith({
			id: mockMember.id,
			memberName: 'Updated Name',
		});
	},
};
