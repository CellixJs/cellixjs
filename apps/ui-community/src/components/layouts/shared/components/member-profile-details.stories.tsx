import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { MemberProfileDetails } from './member-profile-details.tsx';

const meta: Meta<typeof MemberProfileDetails> = {
	title: 'Components/Layouts/Shared/MemberProfileDetails',
	component: MemberProfileDetails,
	parameters: {
		layout: 'padded',
	},
};

export default meta;
type Story = StoryObj<typeof MemberProfileDetails>;

const mockOnSave = fn();

export const Default: Story = {
	args: {
		data: null,
		onSave: mockOnSave,
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify all form fields are present
		expect(canvas.getByLabelText('Name')).toBeInTheDocument();
		expect(canvas.getByLabelText('Email')).toBeInTheDocument();
		expect(canvas.getByLabelText('Bio')).toBeInTheDocument();
		expect(canvas.getByText('Show Interests')).toBeInTheDocument();
		expect(canvas.getByText('Show Email')).toBeInTheDocument();
		expect(canvas.getByText('Show Location')).toBeInTheDocument();
		expect(canvas.getByText('Show Profile')).toBeInTheDocument();
		expect(canvas.getByText('Show Properties')).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: 'Save' })).toBeInTheDocument();
	},
};

export const WithData: Story = {
	args: {
		data: {
			name: 'John Doe',
			email: 'john.doe@example.com',
			bio: 'Software developer with 10 years of experience',
			showInterests: true,
			showEmail: true,
			showLocation: false,
			showProfile: true,
			showProperties: false,
		},
		onSave: mockOnSave,
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify form is populated with data
		const nameInput = canvas.getByLabelText('Name') as HTMLInputElement;
		expect(nameInput.value).toBe('John Doe');

		const emailInput = canvas.getByLabelText('Email') as HTMLInputElement;
		expect(emailInput.value).toBe('john.doe@example.com');

		const bioInput = canvas.getByLabelText('Bio') as HTMLTextAreaElement;
		expect(bioInput.value).toBe(
			'Software developer with 10 years of experience',
		);

		// Verify checkboxes
		const showInterestsCheckbox = canvas.getByRole('checkbox', {
			name: 'Show Interests',
		}) as HTMLInputElement;
		expect(showInterestsCheckbox.checked).toBe(true);

		const showEmailCheckbox = canvas.getByRole('checkbox', {
			name: 'Show Email',
		}) as HTMLInputElement;
		expect(showEmailCheckbox.checked).toBe(true);

		const showLocationCheckbox = canvas.getByRole('checkbox', {
			name: 'Show Location',
		}) as HTMLInputElement;
		expect(showLocationCheckbox.checked).toBe(false);
	},
};

export const FormSubmission: Story = {
	args: {
		data: {
			name: '',
			email: '',
			bio: '',
			showInterests: false,
			showEmail: false,
			showLocation: false,
			showProfile: false,
			showProperties: false,
		},
		onSave: mockOnSave,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Fill in the form
		const nameInput = canvas.getByLabelText('Name');
		await userEvent.type(nameInput, 'Test User');

		const emailInput = canvas.getByLabelText('Email');
		await userEvent.type(emailInput, 'test@example.com');

		const bioInput = canvas.getByLabelText('Bio');
		await userEvent.type(bioInput, 'Test bio');

		// Toggle some checkboxes
		const showEmailCheckbox = canvas.getByRole('checkbox', {
			name: 'Show Email',
		});
		await userEvent.click(showEmailCheckbox);

		const showProfileCheckbox = canvas.getByRole('checkbox', {
			name: 'Show Profile',
		});
		await userEvent.click(showProfileCheckbox);

		// Submit the form
		const submitButton = canvas.getByRole('button', { name: 'Save' });
		await userEvent.click(submitButton);

		// Verify onSave was called with correct data
		expect(mockOnSave).toHaveBeenCalledWith({
			name: 'Test User',
			email: 'test@example.com',
			bio: 'Test bio',
			showInterests: false,
			showEmail: true,
			showLocation: false,
			showProfile: true,
			showProperties: false,
		});
	},
};
