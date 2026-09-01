import type { Meta, StoryObj } from '@storybook/react-vite';
import { PropertyList } from './properties-list.tsx';
import type { PropertyRecord } from './property-types.ts';

const properties: PropertyRecord[] = [
	{
		id: 'property-1',
		propertyName: 'Harborview Unit 101',
		propertyType: 'condo',
		listingDetail: { price: 450000, bedrooms: 2, bathrooms: 1.5, squareFeet: 1200 },
		location: { address: { streetNumber: '125', streetName: 'Harbor Way', municipality: 'Shorewood', countrySubdivision: 'WI', postalCode: '53211' } },
		owner: { id: 'member-1', memberName: 'Property Manager' },
		updatedAt: '2024-01-15T12:00:00.000Z',
	},
];

const meta = {
	title: 'Components/Property/PropertyList',
	component: PropertyList,
	parameters: { layout: 'padded' },
} satisfies Meta<typeof PropertyList>;

export default meta;
type Story = StoryObj<typeof PropertyList>;

export const ManagerDirectory: Story = {
	args: { data: properties, onPropertyView: () => undefined },
};

/** Member projection verifies the owner column is not part of the table. */
export const MemberDirectoryWithoutOwnerIdentity: Story = {
	args: { data: properties, onPropertyView: () => undefined, showOwner: false },
};

export const Empty: Story = {
	args: { data: [], onPropertyView: () => undefined, showOwner: false },
};

export const Loading: Story = {
	args: { data: [], loading: true, showOwner: false },
};
