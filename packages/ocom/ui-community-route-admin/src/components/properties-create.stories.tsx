import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { PropertiesCreate } from './properties-create.tsx';

const members = [{ id: '65f1f77bcf86cd7994390002', memberName: 'Alice Property Manager' }];

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
		members,
		onSave: (property) => console.log('Save property:', property),
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		expect(canvas.getByLabelText('Property Name')).toBeInTheDocument();
		// The domain allows at most 100 characters for a property name
		expect(canvas.getByLabelText('Property Name')).toHaveAttribute('maxlength', '100');
		// The full property form renders with its sections and the owner select
		for (const heading of ['Overview', 'Location', 'Listing']) {
			expect(canvas.getByRole('heading', { name: heading })).toBeInTheDocument();
		}
		expect(canvas.getByLabelText('Owner')).toBeInTheDocument();
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

export const Submitting: Story = {
	args: {
		members,
		submitting: true,
		onSave: (property) => console.log('Save property:', property),
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// While the create mutation is in flight the submit button reports
		// loading, which blocks duplicate create submissions.
		expect(canvas.getByRole('button', { name: /create property/i })).toHaveClass('ant-btn-loading');
	},
};
