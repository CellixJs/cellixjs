import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { PropertiesCreate } from './properties-create.tsx';

const meta = {
	title: 'Components/Layouts/Admin/PropertiesCreate',
	component: PropertiesCreate,
	parameters: {
		layout: 'padded',
	},
} satisfies Meta<typeof PropertiesCreate>;

export default meta;
type Story = StoryObj<typeof PropertiesCreate>;

export const Default: Story = {
	args: {
		onSave: (property) => console.log('Save property:', property),
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		expect(canvas.getByLabelText('Property Name')).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: /create property/i })).toBeInTheDocument();
	},
};

export const MissingNameValidationError: Story = {
	args: {
		onSave: (property) => console.log('Save property:', property),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Submit without a property name to trigger the required validation rule
		await userEvent.click(canvas.getByRole('button', { name: /create property/i }));

		const validationError = await canvas.findByText('Property name is required.');
		expect(validationError).toBeInTheDocument();
	},
};

export const WhitespaceNameValidationError: Story = {
	args: {
		onSave: (property) => console.log('Save property:', property),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Whitespace-only names must be rejected by the whitespace rule
		await userEvent.type(canvas.getByLabelText('Property Name'), '   ');
		await userEvent.click(canvas.getByRole('button', { name: /create property/i }));

		const validationError = await canvas.findByText('Property name is required.');
		expect(validationError).toBeInTheDocument();
	},
};
