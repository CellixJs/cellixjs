import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import type { AdminPropertiesListContainerPropertyFieldsFragment } from '../generated.tsx';
import { PropertiesList } from './properties-list.tsx';

const mockPropertyData: AdminPropertiesListContainerPropertyFieldsFragment[] = [
	{
		__typename: 'Property',
		id: '65f1f77bcf86cd7994390101',
		propertyName: 'Harborview Unit 101',
		propertyType: 'condo',
		listingDetail: {
			__typename: 'PropertyListingDetail',
			bedrooms: 2,
			bathrooms: 1.5,
			squareFeet: 1200,
		},
		createdAt: '2024-01-01T12:00:00.000Z',
		updatedAt: '2024-01-15T12:00:00.000Z',
	},
	{
		__typename: 'Property',
		id: '65f1f77bcf86cd7994390102',
		propertyName: 'Harborview Unit 102',
		propertyType: null,
		listingDetail: null,
		createdAt: '2024-01-02T12:00:00.000Z',
		updatedAt: '2024-01-02T12:00:00.000Z',
	},
	{
		__typename: 'Property',
		id: '65f1f77bcf86cd7994390103',
		propertyName: 'Clubhouse Cottage',
		propertyType: 'single family',
		listingDetail: {
			__typename: 'PropertyListingDetail',
			bedrooms: 4,
			bathrooms: 3,
			squareFeet: 2400,
		},
		createdAt: '2024-01-03T12:00:00.000Z',
		updatedAt: '2024-01-03T12:00:00.000Z',
	},
];

const meta = {
	title: 'Components/Layouts/Admin/PropertiesList',
	component: PropertiesList,
	parameters: {
		layout: 'padded',
	},
} satisfies Meta<typeof PropertiesList>;

export default meta;
type Story = StoryObj<typeof PropertiesList>;

export const Default: Story = {
	args: {
		data: mockPropertyData,
		onPropertyView: (propertyId) => console.log('View property:', propertyId),
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// Verify the property count is displayed
		expect(canvas.getByText('Community Properties (3)')).toBeInTheDocument();

		// Verify property names are displayed in the table
		expect(canvas.getByText('Harborview Unit 101')).toBeInTheDocument();
		expect(canvas.getByText('Harborview Unit 102')).toBeInTheDocument();
		expect(canvas.getByText('Clubhouse Cottage')).toBeInTheDocument();

		// Verify listing detail columns render values and fall back to N/A
		expect(canvas.getByText('condo')).toBeInTheDocument();
		expect(canvas.getByText('1.5')).toBeInTheDocument();
		expect(canvas.getByText('2400')).toBeInTheDocument();
		expect(canvas.getAllByText('N/A').length).toBeGreaterThan(0);

		// Verify View buttons are present for each property
		expect(canvas.getAllByRole('button', { name: /view/i })).toHaveLength(3);
	},
};

export const EmptyState: Story = {
	args: {
		data: [],
		onPropertyView: (propertyId) => console.log('View property:', propertyId),
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// Verify empty state shows zero properties
		expect(canvas.getByText('Community Properties (0)')).toBeInTheDocument();
		expect(canvas.queryByRole('button', { name: /view/i })).not.toBeInTheDocument();
	},
};

export const SingleProperty: Story = {
	args: {
		data: mockPropertyData.slice(0, 1),
		onPropertyView: (propertyId) => console.log('View property:', propertyId),
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// Verify single property count
		expect(canvas.getByText('Community Properties (1)')).toBeInTheDocument();
		expect(canvas.getByText('Harborview Unit 101')).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: /view/i })).toBeInTheDocument();
	},
};

export const Loading: Story = {
	args: {
		data: [],
		loading: true,
	},
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		expect(canvas.getByText('Community Properties (0)')).toBeInTheDocument();
	},
};
