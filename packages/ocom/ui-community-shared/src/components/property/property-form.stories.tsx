import type { Meta, StoryObj } from '@storybook/react-vite';
import { PROPERTY_EDIT_POLICIES } from './property-edit-policy.ts';
import { PropertyForm } from './property-form.tsx';
import type { PropertyFormValues } from './property-types.ts';

const memberOptions = [
	{ id: 'member-1', memberName: 'Property Manager' },
	{ id: 'member-2', memberName: 'Resident Owner' },
];

const populatedValues: PropertyFormValues = {
	propertyName: 'Harborview Unit 205',
	propertyType: 'condo',
	ownerId: 'member-2',
	listedForSale: true,
	listedInDirectory: true,
	tags: 'waterfront, pool',
	location: { address: { streetNumber: '125', streetName: 'Harbor Way', municipality: 'Shorewood', countrySubdivision: 'WI', country: 'United States' } },
	listingDetail: {
		price: 450000,
		bedrooms: 3,
		bathrooms: 2.5,
		amenities: 'gym, sauna',
		bedroomDetails: [{ roomName: 'Primary Suite', bedDescriptions: 'king' }],
		additionalAmenities: [{ category: 'Outdoor', amenities: 'patio, grill' }],
		images: 'https://example.com/front.jpg',
	},
};

const meta = {
	title: 'Components/Property/PropertyForm',
	component: PropertyForm,
	parameters: { layout: 'padded' },
} satisfies Meta<typeof PropertyForm>;

export default meta;
type Story = StoryObj<typeof PropertyForm>;

/** Full manager create controls, including owner and property type. */
export const ManagerCreate: Story = {
	args: {
		editPolicy: PROPERTY_EDIT_POLICIES.managerCreate,
		members: memberOptions,
		submitLabel: 'Create Property',
		onSubmit: () => undefined,
	},
};

/** Server-owned member creation intentionally has no owner or type control. */
export const MemberCreate: Story = {
	args: {
		editPolicy: PROPERTY_EDIT_POLICIES.memberCreate,
		submitLabel: 'Create Property',
		onSubmit: () => undefined,
	},
};

/** Owners can edit listing content but never rename, retype, or transfer. */
export const OwnedMemberEdit: Story = {
	args: {
		editPolicy: PROPERTY_EDIT_POLICIES.memberEdit,
		initialValues: populatedValues,
		submitLabel: 'Save',
		onSubmit: () => undefined,
	},
};

/** This state demonstrates validation-ready dynamic rows at the domain cap. */
export const DynamicListLimit: Story = {
	args: {
		editPolicy: PROPERTY_EDIT_POLICIES.memberEdit,
		initialValues: {
			...populatedValues,
			listingDetail: {
				...populatedValues.listingDetail,
				bedroomDetails: Array.from({ length: 50 }, (_value, index) => ({ roomName: `Bedroom ${index + 1}` })),
				additionalAmenities: Array.from({ length: 50 }, (_value, index) => ({ category: `Category ${index + 1}` })),
			},
		},
		submitLabel: 'Save',
		onSubmit: () => undefined,
	},
};

/** Empty values are available to exercise central inline validation manually. */
export const ValidationState: Story = {
	args: {
		editPolicy: PROPERTY_EDIT_POLICIES.memberCreate,
		submitLabel: 'Create Property',
		onSubmit: () => undefined,
	},
};
