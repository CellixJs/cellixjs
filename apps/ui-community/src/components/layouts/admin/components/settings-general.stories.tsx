import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SettingsGeneral } from './settings-general.tsx';
import type { AdminSettingsGeneralContainerCommunityFieldsFragment } from '../../../../generated.tsx';

const mockData: AdminSettingsGeneralContainerCommunityFieldsFragment = {
	__typename: 'Community',
	id: '507f1f77bcf86cd799439011',
	name: 'Test Community',
	domain: 'test.com',
	whiteLabelDomain: 'wl.test.com',
	handle: 'testcommunity',
	createdAt: '2024-01-01T12:00:00.000Z',
	updatedAt: '2024-01-15T12:00:00.000Z',
};

const meta = {
	title: 'Components/Layouts/Admin/SettingsGeneral',
	component: SettingsGeneral,
	parameters: {
		layout: 'padded',
	},
	argTypes: {
		onSave: { action: 'onSave' },
		loading: { control: 'boolean' },
	},
} satisfies Meta<typeof SettingsGeneral>;

export default meta;
type Story = StoryObj<typeof SettingsGeneral>;

export const Default: Story = {
	args: {
		data: mockData,
		onSave: fn(),
		loading: false,
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);
		
		// Verify community info is displayed
		expect(canvas.getByText(mockData.id)).toBeInTheDocument();
		expect(canvas.getByText(/1\/1\/2024/)).toBeInTheDocument(); // Created date
		
		// Verify form fields have correct values
		const nameInput = canvas.getByPlaceholderText('Name') as HTMLInputElement;
		expect(nameInput.value).toBe(mockData.name);
	},
};

export const Loading: Story = {
	args: {
		data: mockData,
		onSave: fn(),
		loading: true,
	},
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement);
		
		// Verify save button is in loading state
		const saveButton = canvas.getByRole('button', { name: /save/i });
		expect(saveButton).toHaveClass('ant-btn-loading');
	},
};

export const WithMinimalData: Story = {
	args: {
		data: {
			__typename: 'Community',
			id: '507f1f77bcf86cd799439011',
			name: 'Minimal Community',
			domain: null,
			whiteLabelDomain: null,
			handle: null,
			createdAt: '2024-01-01T12:00:00.000Z',
			updatedAt: '2024-01-01T12:00:00.000Z',
		},
		onSave: fn(),
		loading: false,
	},
};

export const FormSubmission: Story = {
	args: {
		data: mockData,
		onSave: fn(),
		loading: false,
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		
		// Update the name field
		const nameInput = canvas.getByPlaceholderText('Name');
		await userEvent.clear(nameInput);
		await userEvent.type(nameInput, 'Updated Community Name');
		
		// Submit the form
		const saveButton = canvas.getByRole('button', { name: /save/i });
		await userEvent.click(saveButton);
		
		// Verify onSave was called (action will be logged in Storybook)
		expect(args.onSave).toHaveBeenCalled();
	},
};
