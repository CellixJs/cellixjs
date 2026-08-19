import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import type { AdminPropertiesDetailContainerPropertyFieldsFragment } from '../generated.tsx';
import { PropertiesDetail, type PropertiesDetailSaveInput } from './properties-detail.tsx';

const mockProperty: AdminPropertiesDetailContainerPropertyFieldsFragment = {
	__typename: 'Property',
	id: '65f1f77bcf86cd7994390201',
	propertyName: 'Harborview Unit 205',
	propertyType: 'condo',
	listedForSale: true,
	listedForRent: false,
	listedForLease: false,
	listedInDirectory: true,
	tags: ['waterfront', 'pool'],
	owner: {
		__typename: 'Member',
		id: '65f1f77bcf86cd7994390002',
		memberName: 'Alice Property Manager',
	},
	location: {
		__typename: 'PropertyLocation',
		address: {
			__typename: 'PropertyAddress',
			streetNumber: '125',
			streetName: 'Harbor Way',
			municipality: 'Shorewood',
			countrySubdivision: 'WI',
			postalCode: '53211',
			country: 'United States',
		},
	},
	listingDetail: {
		__typename: 'PropertyListingDetail',
		price: 450000,
		rentHigh: null,
		rentLow: null,
		lease: null,
		maxGuests: 6,
		bedrooms: 3,
		bathrooms: 2.5,
		squareFeet: 1750,
		yearBuilt: 2004,
		lotSize: 4300,
		description: 'Bright corner unit overlooking the harbor.',
		amenities: ['gym', 'sauna'],
		bedroomDetails: [
			{
				__typename: 'PropertyBedroomDetail',
				id: '65f1f77bcf86cd7994390301',
				roomName: 'Primary Suite',
				bedDescriptions: ['king'],
			},
		],
		additionalAmenities: [
			{
				__typename: 'PropertyAdditionalAmenity',
				id: '65f1f77bcf86cd7994390401',
				category: 'Outdoor',
				amenities: ['patio', 'grill'],
			},
		],
		images: ['https://example.com/images/front.jpg'],
		video: 'https://example.com/video/tour.mp4',
		floorPlan: 'https://example.com/plans/unit205.pdf',
		floorPlanImages: ['https://example.com/plans/unit205.png'],
		listingAgent: 'Terry Broker',
		listingAgentPhone: '555-0100',
		listingAgentEmail: 'terry@example.com',
		listingAgentWebsite: 'https://example.com/terry',
		listingAgentCompany: 'Harbor Realty',
		listingAgentCompanyPhone: '555-0101',
		listingAgentCompanyEmail: 'contact@harborrealty.example.com',
		listingAgentCompanyWebsite: 'https://harborrealty.example.com',
		listingAgentCompanyAddress: '1 Realty Plaza, Shorewood, WI',
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

		// Comma-separated fields render list values joined with ', '
		expect(canvas.getByLabelText('Tags')).toHaveValue('waterfront, pool');
		expect(canvas.getByLabelText('City')).toHaveValue('Shorewood');
		expect(canvas.getByLabelText('Room Name')).toHaveValue('Primary Suite');
		expect(canvas.getByLabelText('Category')).toHaveValue('Outdoor');

		// The stored owner is shown by the Owner select even without a members list
		expect(canvas.getByTitle('Alice Property Manager')).toBeInTheDocument();

		// Section headings structure the form
		for (const heading of ['Overview', 'Location', 'Listing', 'Details', 'Amenities', 'Media', 'Agent']) {
			expect(canvas.getByRole('heading', { name: heading })).toBeInTheDocument();
		}

		expect(canvas.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
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
		await userEvent.click(canvas.getByRole('button', { name: /^save$/i }));

		const validationError = await canvas.findByText('Property name is required.');
		expect(validationError).toBeInTheDocument();
	},
};

const saveAndCloseInputs: PropertiesDetailSaveInput[] = [];

export const SaveAndClose: Story = {
	args: {
		data: mockProperty,
		onSave: async (values) => console.log('Save property:', values),
		onSaveAndClose: (values) => {
			saveAndCloseInputs.push(values);
			return Promise.resolve();
		},
		onRemove: async () => console.log('Remove property'),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// The details screen offers Save & Close next to Save
		expect(canvas.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
		await userEvent.click(canvas.getByRole('button', { name: /save & close/i }));

		// The validated update input routes to the Save & Close handler
		await waitFor(() => expect(saveAndCloseInputs.length).toBeGreaterThan(0));
		expect(saveAndCloseInputs[0]?.propertyName).toBe('Harborview Unit 205');
	},
};

export const SaveAndCloseBlockedByValidation: Story = {
	args: {
		data: mockProperty,
		onSave: async (values) => console.log('Save property:', values),
		onSaveAndClose: async (values) => console.log('Save & Close property:', values),
		onRemove: async () => console.log('Remove property'),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// An invalid form blocks Save & Close with an inline error instead of submitting
		await userEvent.clear(canvas.getByLabelText('Property Name'));
		await userEvent.click(canvas.getByRole('button', { name: /save & close/i }));

		const validationError = await canvas.findByText('Property name is required.');
		expect(validationError).toBeInTheDocument();
	},
};
