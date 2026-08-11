import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import type { AdminPropertiesDetailContainerPropertyFieldsFragment } from '../generated.tsx';
import { PropertiesDetail } from './properties-detail.tsx';

const mockProperty: AdminPropertiesDetailContainerPropertyFieldsFragment = {
	__typename: 'Property',
	id: '65f1f77bcf86cd7994390201',
	propertyName: 'Harborview Unit 205',
	propertyType: 'condo',
	listingDetail: {
		__typename: 'PropertyListingDetail',
		bedrooms: 3,
		bathrooms: 2.5,
		squareFeet: 1750,
	},
	createdAt: '2024-01-01T12:00:00.000Z',
	updatedAt: '2024-01-15T12:00:00.000Z',
};

const meta = {
	title: 'Components/Layouts/Admin/PropertiesDetail',
	component: PropertiesDetail,
	parameters: {
		layout: 'padded',
	},
} satisfies Meta<typeof PropertiesDetail>;

export default meta;
type Story = StoryObj<typeof PropertiesDetail>;

export const Default: Story = {
	args: {
		data: mockProperty,
		onSave: async (values) => console.log('Save property:', values),
		onRemove: async () => console.log('Remove property'),
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// The editable form is populated with the property values
		expect(canvas.getByLabelText('Property Name')).toHaveValue('Harborview Unit 205');
		// The domain allows at most 100 characters for a property name
		expect(canvas.getByLabelText('Property Name')).toHaveAttribute('maxlength', '100');
		expect(canvas.getByLabelText('Property Type')).toHaveValue('condo');
		expect(canvas.getByLabelText('Bedrooms')).toHaveValue('3');
		expect(canvas.getByLabelText('Bathrooms')).toHaveValue('2.5');
		expect(canvas.getByLabelText('Square Feet')).toHaveValue('1750');

		expect(canvas.getByRole('button', { name: /save/i })).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: /remove property/i })).toBeInTheDocument();
	},
};

export const WithoutListingDetail: Story = {
	args: {
		data: {
			...mockProperty,
			propertyType: null,
			listingDetail: null,
		},
		onSave: async (values) => console.log('Save property:', values),
		onRemove: async () => console.log('Remove property'),
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		expect(canvas.getByLabelText('Property Name')).toHaveValue('Harborview Unit 205');
		expect(canvas.getByLabelText('Property Type')).toHaveValue('');
		expect(canvas.getByLabelText('Bedrooms')).toHaveValue('');
	},
};

export const RemoveConfirmation: Story = {
	args: {
		data: mockProperty,
		onSave: async (values) => console.log('Save property:', values),
		onRemove: async () => console.log('Remove property'),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Removal must be protected by a confirmation modal
		await userEvent.click(canvas.getByRole('button', { name: /remove property/i }));

		const body = within(canvasElement.ownerDocument.body);
		const modalTitle = await body.findByText('Remove this property?');
		expect(modalTitle).toBeInTheDocument();
		const confirmButton = body.getAllByRole('button', { name: /^remove property$/i }).find((button) => button.closest('.ant-modal-footer'));
		expect(confirmButton).toBeDefined();
	},
};

export const MissingNameValidationError: Story = {
	args: {
		data: mockProperty,
		onSave: async (values) => console.log('Save property:', values),
		onRemove: async () => console.log('Remove property'),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Clearing the property name must trigger the required validation rule
		await userEvent.clear(canvas.getByLabelText('Property Name'));
		await userEvent.click(canvas.getByRole('button', { name: /save/i }));

		const validationError = await canvas.findByText('Property name is required.');
		expect(validationError).toBeInTheDocument();
	},
};
