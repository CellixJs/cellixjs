import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CommunityCreate, type CommunityCreateProps } from './community-create.tsx';

const meta = {
	title: 'Components/Accounts/CommunityCreate',
	component: CommunityCreate,
	parameters: {
		layout: 'padded',
	},
	argTypes: {
		onSave: { action: 'onSave' },
	},
} satisfies Meta<typeof CommunityCreate>;

export default meta;
type Story = StoryObj<typeof CommunityCreate>;

export const Default: Story = {
	args: {
		onSave: fn(),
	} satisfies CommunityCreateProps,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify the title is present
		const title = await canvas.findByText('Creating your Community');
		expect(title).toBeInTheDocument();

		// Verify the description text is present
		const description = await canvas.findByText(/Getting started with your community/);
		expect(description).toBeInTheDocument();

		// Verify the form elements are present
		const nameInput = canvas.getByPlaceholderText('Name');
		expect(nameInput).toBeInTheDocument();

		const submitButton = await canvas.findByRole('button', {
			name: /create community/i,
		});
		expect(submitButton).toBeInTheDocument();
	},
};

export const FormSubmission: Story = {
	args: {
		onSave: fn(),
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// Fill out the form
		const nameInput = canvas.getByPlaceholderText('Name');
		await userEvent.type(nameInput, 'Test Community');

		// Submit the form
		const submitButton = await canvas.findByRole('button', {
			name: /create community/i,
		});
		await userEvent.click(submitButton);

		// Verify the onSave callback was called with the correct data
		expect(args.onSave).toHaveBeenCalledWith({ name: 'Test Community' });
	},
};

export const WithSubscriptionAndPaymentInstrument: Story = {
	args: {
		onSave: fn(),
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		await userEvent.type(canvas.getByPlaceholderText('Name'), 'Billed Community');
		await userEvent.type(canvas.getByLabelText('Payment token'), 'tok_visa');
		await userEvent.type(canvas.getByLabelText('Billing name'), 'Alice Owner');

		await userEvent.click(await canvas.findByRole('button', { name: /create community/i }));

		await expect(args.onSave).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'Billed Community',
				paymentInstrument: expect.objectContaining({ paymentToken: 'tok_visa', billingName: 'Alice Owner' }),
			}),
		);
	},
};

export const RequiresAPaymentTokenWhenBillingIsStarted: Story = {
	args: {
		onSave: fn(),
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		await userEvent.type(canvas.getByPlaceholderText('Name'), 'Missing Token Community');
		await userEvent.type(canvas.getByLabelText('Billing city'), 'Portland');

		await userEvent.click(await canvas.findByRole('button', { name: /create community/i }));

		expect(await canvas.findByText('A payment instrument is required to start a subscription.')).toBeInTheDocument();
		expect(args.onSave).not.toHaveBeenCalled();
	},
};

export const FormValidation: Story = {
	args: {
		onSave: fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Try to submit without filling the required field
		const submitButton = await canvas.findByRole('button', {
			name: /create community/i,
		});
		await userEvent.click(submitButton);

		// Verify validation error appears
		const errorMessage = await canvas.findByText('Please input Name!');
		expect(errorMessage).toBeInTheDocument();
	},
};
