import { MockedProvider } from '@apollo/client/testing';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, within } from 'storybook/test';
import { AdminPropertiesListContainerPropertiesDocument } from '../generated.tsx';
import { PropertiesList } from './properties-list.tsx';

const communityId = '65f1f77bcf86cd7994390001';

const propertiesListMock = {
	request: {
		query: AdminPropertiesListContainerPropertiesDocument,
		variables: { communityId },
	},
	result: {
		data: {
			propertiesByCommunityId: [
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
			],
		},
	},
};

const routerDecorator = (mocks: Parameters<typeof MockedProvider>[0]['mocks']) => {
	const Decorator = (Story: React.ComponentType) => (
		<HelmetProvider>
			<MockedProvider mocks={mocks}>
				<MemoryRouter initialEntries={[`/community/${communityId}/admin/65f1f77bcf86cd7994390002/properties`]}>
					<Routes>
						<Route path="/community/:communityId/admin/:memberId/properties">
							<Route
								path=""
								element={<Story />}
							/>
							<Route
								path="create"
								element={<div>Create Property Route</div>}
							/>
						</Route>
					</Routes>
				</MemoryRouter>
			</MockedProvider>
		</HelmetProvider>
	);
	return Decorator;
};

const meta = {
	title: 'Pages/Admin/PropertiesList',
	component: PropertiesList,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof PropertiesList>;

export default meta;
type Story = StoryObj<typeof PropertiesList>;

export const Default: Story = {
	decorators: [routerDecorator([propertiesListMock])],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Page header with title and top-right Add Property action
		expect(canvas.getByText('Properties')).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: /add property/i })).toBeInTheDocument();

		// List content renders once the query resolves
		expect(await canvas.findByText('Harborview Unit 101')).toBeInTheDocument();
	},
};

export const EmptyList: Story = {
	decorators: [
		routerDecorator([
			{
				request: {
					query: AdminPropertiesListContainerPropertiesDocument,
					variables: { communityId },
				},
				result: {
					data: {
						propertiesByCommunityId: [],
					},
				},
			},
		]),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		expect(await canvas.findByText('Community Properties (0)')).toBeInTheDocument();
	},
};
