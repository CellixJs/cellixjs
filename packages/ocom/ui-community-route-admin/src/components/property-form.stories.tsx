import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
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
			country: 'United States',
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

		// The stored state code renders its full name in the State dropdown
		expect(canvas.getByTitle('Wisconsin')).toBeInTheDocument();
		expect(canvas.getByTitle('United States')).toBeInTheDocument();

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

export const AddressDropdownSelects: Story = {
	args: {
		members,
		submitLabel: 'Create Property',
		onSubmit: (values) => console.log('Submit property:', values),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// State and Country are dropdown selects, not free-text inputs
		const stateSelect = canvas.getByLabelText('State');
		const countrySelect = canvas.getByLabelText('Country');
		expect(stateSelect).toHaveAttribute('role', 'combobox');
		expect(countrySelect).toHaveAttribute('role', 'combobox');

		// Typing filters the state options by their full name
		await userEvent.click(stateSelect);
		await userEvent.type(stateSelect, 'New York');
		await userEvent.click(await canvas.findByTitle('New York'));
		const stateRoot = stateSelect.closest('.ant-select') as HTMLElement;
		await waitFor(() => expect(within(stateRoot).getByTitle('New York')).toBeInTheDocument());

		// The country dropdown offers United States
		await userEvent.click(countrySelect);
		await userEvent.click(await canvas.findByTitle('United States'));
		const countryRoot = countrySelect.closest('.ant-select') as HTMLElement;
		await waitFor(() => expect(within(countryRoot).getByTitle('United States')).toBeInTheDocument());
	},
};

export const NumberFieldPresentation: Story = {
	args: {
		members,
		submitLabel: 'Create Property',
		onSubmit: (values) => console.log('Submit property:', values),
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		const inputNumberRootOf = (label: string): HTMLElement => canvas.getByLabelText(label).closest('.ant-input-number') as HTMLElement;

		// Money fields carry a $ prefix; lease and lot size carry unit suffixes
		for (const label of ['Price', 'Rent High', 'Rent Low']) {
			expect(inputNumberRootOf(label).querySelector('.ant-input-number-prefix')).toHaveTextContent('$');
		}
		expect(inputNumberRootOf('Lease').querySelector('.ant-input-number-suffix')).toHaveTextContent('months');
		expect(inputNumberRootOf('Lot Size').querySelector('.ant-input-number-suffix')).toHaveTextContent('sq ft');

		// Continuous-value fields hide the spinner controls; count-like fields keep them
		for (const label of ['Price', 'Rent High', 'Rent Low', 'Lease', 'Square Feet', 'Year Built', 'Lot Size']) {
			expect(inputNumberRootOf(label).querySelector('.ant-input-number-actions')).toBeNull();
		}
		for (const label of ['Max Guests', 'Bedrooms', 'Bathrooms']) {
			expect(inputNumberRootOf(label).querySelector('.ant-input-number-actions')).not.toBeNull();
		}
	},
};

export const InlineValidationErrors: Story = {
	args: {
		members,
		submitLabel: 'Create Property',
		onSubmit: (values) => console.log('Submit property:', values),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Values the domain would reject must be flagged inline on submit
		await userEvent.type(canvas.getByLabelText('Property Name'), 'Validation Villa');
		await userEvent.type(canvas.getByLabelText('Listing Agent Email'), 'not-an-email');
		await userEvent.type(canvas.getByLabelText('Lot Size'), '0.5');
		await userEvent.click(canvas.getByRole('button', { name: /create property/i }));

		expect(await canvas.findByText('Listing agent email must be a valid email address')).toBeInTheDocument();
		expect(await canvas.findByText('Lot size must be a whole number')).toBeInTheDocument();
	},
};

const saveAndCloseSubmissions: PropertyFormValues[] = [];

export const SaveAndCloseSubmit: Story = {
	args: {
		initialValues: populatedValues,
		members,
		submitLabel: 'Save',
		onSubmit: (values) => console.log('Submit property:', values),
		onSubmitAndClose: (values) => {
			saveAndCloseSubmissions.push(values);
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// With an onSubmitAndClose handler the form offers both submit buttons
		expect(canvas.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
		await userEvent.click(canvas.getByRole('button', { name: /save & close/i }));

		// The validated values route to the Save & Close handler
		await waitFor(() => expect(saveAndCloseSubmissions.length).toBeGreaterThan(0));
		expect(saveAndCloseSubmissions[0]?.propertyName).toBe('Harborview Unit 205');
	},
};
