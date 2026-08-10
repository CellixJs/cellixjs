import { MockedProvider } from '@apollo/client/testing';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App as AntdApp } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, within } from 'storybook/test';
import { AdminPropertiesDetailContainerPropertyDocument } from '../generated.tsx';
import { PropertiesDetail } from './properties-detail.tsx';

const communityId = '65f1f77bcf86cd7994390001';
const propertyId = '65f1f77bcf86cd7994390201';

const propertyQueryMock = {
	request: {
		query: AdminPropertiesDetailContainerPropertyDocument,
		variables: { id: propertyId },
	},
	result: {
		data: {
			property: {
				__typename: 'Property',
				id: propertyId,
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
			},
		},
	},
};

const routerDecorator = (mocks: Parameters<typeof MockedProvider>[0]['mocks']) => {
	const Decorator = (Story: React.ComponentType) => (
		<HelmetProvider>
			<MockedProvider mocks={mocks}>
				<AntdApp>
					<MemoryRouter initialEntries={[`/community/${communityId}/admin/65f1f77bcf86cd7994390002/properties/${propertyId}`]}>
						<Routes>
							<Route path="/community/:communityId/admin/:memberId/properties">
								<Route
									path=""
									element={<div>Properties List Route</div>}
								/>
								<Route
									path=":id/*"
									element={<Story />}
								/>
							</Route>
						</Routes>
					</MemoryRouter>
				</AntdApp>
			</MockedProvider>
		</HelmetProvider>
	);
	return Decorator;
};

const meta = {
	title: 'Pages/Admin/PropertiesDetail',
	component: PropertiesDetail,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof PropertiesDetail>;

export default meta;
type Story = StoryObj<typeof PropertiesDetail>;

export const Default: Story = {
	decorators: [routerDecorator([propertyQueryMock])],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Page header plus the populated edit form
		expect(canvas.getByText('Property Detail')).toBeInTheDocument();
		expect(await canvas.findByLabelText('Property Name')).toHaveValue('Harborview Unit 205');
		expect(canvas.getByRole('button', { name: /save/i })).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: /remove property/i })).toBeInTheDocument();
	},
};

export const NotFound: Story = {
	decorators: [
		routerDecorator([
			{
				request: {
					query: AdminPropertiesDetailContainerPropertyDocument,
					variables: { id: propertyId },
				},
				result: {
					data: {
						property: null,
					},
				},
			},
		]),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		expect(await canvas.findByText('Property Not Found')).toBeInTheDocument();
	},
};
