import type { Meta, StoryObj } from '@storybook/react-vite';
import { PropertyDetails } from './properties-detail.tsx';
import { PROPERTY_EDIT_POLICIES } from './property-edit-policy.ts';
import type { PropertyRecord } from './property-types.ts';

const property: PropertyRecord = {
	id: 'property-1',
	propertyName: 'Harborview Unit 205',
	propertyType: 'condo',
	listedForSale: true,
	listedInDirectory: true,
	tags: ['waterfront', 'pool'],
	owner: { id: 'member-2', memberName: 'Foreign Same-Community Owner' },
	location: { address: { streetNumber: '125', streetName: 'Harbor Way', municipality: 'Shorewood', countrySubdivision: 'WI', postalCode: '53211', country: 'United States' } },
	listingDetail: { price: 450000, bedrooms: 3, bathrooms: 2.5, description: 'Bright corner unit overlooking the harbor.', amenities: ['gym', 'sauna'] },
	createdAt: '2024-01-01T12:00:00.000Z',
	updatedAt: '2024-01-15T12:00:00.000Z',
};

const meta = {
	title: 'Components/Property/PropertyDetails',
	component: PropertyDetails,
	parameters: { layout: 'padded' },
} satisfies Meta<typeof PropertyDetails>;

export default meta;
type Story = StoryObj<typeof PropertyDetails>;

export const ManagerEdit: Story = {
	args: {
		data: property,
		editPolicy: PROPERTY_EDIT_POLICIES.managerEdit,
		members: [{ id: 'member-2', memberName: 'Foreign Same-Community Owner' }],
		onSubmit: () => undefined,
	},
};

/** Owner identity is intentionally not rendered in this shared read-only view. */
export const ForeignOrUnownedReadOnly: Story = {
	args: {
		data: property,
		editPolicy: PROPERTY_EDIT_POLICIES.readOnly,
	},
};
