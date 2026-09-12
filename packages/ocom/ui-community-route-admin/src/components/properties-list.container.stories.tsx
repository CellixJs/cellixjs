import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, userEvent, within } from 'storybook/test';
import { AdminPropertiesListContainerPropertiesDocument } from '../generated.tsx';
import { PropertiesListContainer } from './properties-list.container.tsx';

const communityId = '65f1f77bcf86cd7994390001';

const mockProperties = [
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
];

const successMock = {
	request: {
		query: AdminPropertiesListContainerPropertiesDocument,
		variables: { communityId },
	},
	result: {
		data: {
			propertiesByCommunityId: mockProperties,
		},
	},
};

const routerDecorator = (mocks: Parameters<typeof MockedProvider>[0]['mocks']) => {
	const Decorator = (Story: React.ComponentType) => (
		<MockedProvider mocks={mocks}>
			<MemoryRouter initialEntries={[`/community/${communityId}/admin/65f1f77bcf86cd7994390002/properties`]}>
				<Routes>
					<Route path="/community/:communityId/admin/:memberId/properties">
						<Route
							path=""
							element={<Story />}
						/>
						<Route
							path=":id/*"
							element={<div>Property Detail Route</div>}
						/>
					</Route>
				</Routes>
			</MemoryRouter>
		</MockedProvider>
	);
	return Decorator;
};

const meta = {
	title: 'Components/Layouts/Admin/PropertiesListContainer',
	component: PropertiesListContainer,
	parameters: {
		layout: 'padded',
	},
} satisfies Meta<typeof PropertiesListContainer>;

export default meta;
type Story = StoryObj<typeof PropertiesListContainer>;

export const Success: Story = {
	decorators: [routerDecorator([successMock])],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		expect(await canvas.findByText('Community Properties (2)')).toBeInTheDocument();
		expect(canvas.getByText('Harborview Unit 101')).toBeInTheDocument();
		expect(canvas.getByText('Harborview Unit 102')).toBeInTheDocument();
	},
};

export const NavigatesToDetailOnView: Story = {
	decorators: [routerDecorator([successMock])],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const viewButtons = await canvas.findAllByRole('button', { name: /view/i });
		await userEvent.click(viewButtons[0] as HTMLElement);

		expect(await canvas.findByText('Property Detail Route')).toBeInTheDocument();
	},
};

export const Loading: Story = {
	decorators: [
		routerDecorator([
			{
				...successMock,
				delay: 1_000_000,
			},
		]),
	],
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// While loading, no property rows are rendered yet
		expect(canvas.queryByText('Harborview Unit 101')).not.toBeInTheDocument();
	},
};

export const ErrorState: Story = {
	decorators: [
		routerDecorator([
			{
				request: {
					query: AdminPropertiesListContainerPropertiesDocument,
					variables: { communityId },
				},
				error: new Error('Failed to load properties'),
			},
		]),
	],
	play: async ({ canvasElement }) => {
		const body = within(canvasElement.ownerDocument.body);

		expect(await body.findByText(/Failed to load properties/i)).toBeInTheDocument();
	},
};
