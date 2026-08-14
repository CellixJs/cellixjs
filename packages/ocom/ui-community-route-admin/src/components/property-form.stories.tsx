import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { PropertyForm, type PropertyFormValues } from './property-form.tsx';

const members = [
	{ id: '65f1f77bcf86cd7994390002', memberName: 'Alice Property Manager' },
	{ id: '65f1f77bcf86cd7994390005', memberName: 'Bob Resident' },
];

const populatedValues: PropertyFormValues = {
	propertyName: 'Harborview Unit 205',
	propertyType: 'condo',
	ownerId: '65f1f77bcf86cd7994390002',
	listedForSale: true,
	listedForRent: false,
	listedForLease: false,
	listedInDirectory: true,
	tags: 'waterfront, pool',
	location: {
		address: {
			streetNumber: '125',
			streetName: 'Harbor Way',
			municipality: 'Shorewood',
			countrySubdivision: 'WI',
			postalCode: '53211',
			country: 'USA',
		},
	},
	listingDetail: {
		price: 450000,
		bedrooms: 3,
		bathrooms: 2.5,
		squareFeet: 1750,
		description: 'Bright corner unit overlooking the harbor.',
		amenities: 'gym, sauna',
		bedroomDetails: [{ roomName: 'Primary Suite', bedDescriptions: 'king' }],
		additionalAmenities: [{ category: 'Outdoor', amenities: 'patio, grill' }],
		images: 'https://example.com/images/front.jpg',
		video: 'https://example.com/video/tour.mp4',
		floorPlan: 'https://example.com/plans/unit205.pdf',
		floorPlanImages: 'https://example.com/plans/unit205.png',
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
};

const meta = {
	title: 'Components/Layouts/Admin/PropertyForm',
	component: PropertyForm,
	parameters: {
		layout: 'padded',
	},
} satisfies Meta<typeof PropertyForm>;

export default meta;
type Story = StoryObj<typeof PropertyForm>;

export const EmptyCreate: Story = {
	args: {
		members,
		submitLabel: 'Create Property',
		onSubmit: (values) => console.log('Submit property:', values),
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// All sections of the full property form are rendered
		for (const heading of ['Overview', 'Location', 'Listing', 'Details', 'Bedroom Details', 'Amenities', 'Additional Amenities', 'Media', 'Agent']) {
			expect(canvas.getByRole('heading', { name: heading })).toBeInTheDocument();
		}

		expect(canvas.getByLabelText('Property Name')).toHaveValue('');
		expect(canvas.getByLabelText('Owner')).toBeInTheDocument();
		expect(canvas.getByLabelText('Listed For Sale')).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: /add bedroom detail/i })).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: /add additional amenity/i })).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: /create property/i })).toBeInTheDocument();
	},
};

export const PopulatedEdit: Story = {
	args: {
		initialValues: populatedValues,
		members,
		submitLabel: 'Save',
		onSubmit: (values) => console.log('Submit property:', values),
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		expect(canvas.getByLabelText('Property Name')).toHaveValue('Harborview Unit 205');
		expect(canvas.getByLabelText('Tags')).toHaveValue('waterfront, pool');
		expect(canvas.getByLabelText('City')).toHaveValue('Shorewood');
		expect(canvas.getByLabelText('Bathrooms')).toHaveValue('2.5');
		expect(canvas.getByLabelText('Room Name')).toHaveValue('Primary Suite');
		expect(canvas.getByLabelText('Category')).toHaveValue('Outdoor');
		expect(canvas.getByTitle('Alice Property Manager')).toBeInTheDocument();

		// Switches reflect the listing flags
		expect(canvas.getByLabelText('Listed For Sale')).toHaveAttribute('aria-checked', 'true');
		expect(canvas.getByLabelText('Listed For Rent')).toHaveAttribute('aria-checked', 'false');

		// Media URLs render inline previews
		expect(canvas.getByRole('link', { name: 'https://example.com/video/tour.mp4' })).toBeInTheDocument();
		expect(canvas.getByRole('link', { name: 'https://example.com/plans/unit205.pdf' })).toBeInTheDocument();

		expect(canvas.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
	},
};

export const BathroomsIncrementValidationError: Story = {
	args: {
		members,
		submitLabel: 'Create Property',
		onSubmit: (values) => console.log('Submit property:', values),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// A bathrooms value that is not a multiple of 0.5 must be rejected
		await userEvent.type(canvas.getByLabelText('Bathrooms'), '2.3');
		await userEvent.click(canvas.getByRole('button', { name: /create property/i }));

		const validationError = await canvas.findByText('Bathrooms must be in increments of 0.5');
		expect(validationError).toBeInTheDocument();
	},
};
