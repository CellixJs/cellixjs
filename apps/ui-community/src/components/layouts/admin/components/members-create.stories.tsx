import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { MembersCreate } from './members-create.tsx';

const meta: Meta<typeof MembersCreate> = {
	title: 'Components/Layouts/Admin/MembersCreate',
	component: MembersCreate,
	parameters: {
		layout: 'padded',
	},
};

export default meta;
type Story = StoryObj<typeof MembersCreate>;

const mockOnSave = fn();

export const Default: Story = {
	args: {
		data: {
			memberName: '',
		},
		onSave: mockOnSave,
		loading: false,
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify form is rendered
		expect(canvas.getByLabelText('Member Name')).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: 'Create Member' })).toBeInTheDocument();
	},
};

export const WithPrefilledData: Story = {
	args: {
		data: {
			memberName: 'John Doe',
		},
		onSave: mockOnSave,
		loading: false,
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify prefilled data
		const input = canvas.getByLabelText('Member Name') as HTMLInputElement;
		expect(input.value).toBe('John Doe');
	},
};

export const Loading: Story = {
	args: {
		data: {
			memberName: 'Test Member',
		},
		onSave: mockOnSave,
		loading: true,
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify loading state - button text is still present but button has loading class
		const button = canvas.getByText('Create Member').closest('button');
		expect(button).toHaveClass('ant-btn-loading');
	},
};

export const FormSubmission: Story = {
	args: {
		data: {
			memberName: '',
		},
		onSave: mockOnSave,
		loading: false,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Fill in the form
		const input = canvas.getByLabelText('Member Name');
		await userEvent.clear(input);
		await userEvent.type(input, 'New Member');

		// Submit the form
		const submitButton = canvas.getByRole('button', { name: 'Create Member' });
		await userEvent.click(submitButton);

		// Verify onSave was called with correct data
		expect(mockOnSave).toHaveBeenCalledWith({ memberName: 'New Member' });
	},
};
