import { MockedProvider } from '@apollo/client/testing';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App as AntdApp } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, within } from 'storybook/test';
import { AdminMemberListContainerMembersDocument, AdminPropertiesDetailContainerPropertyDocument } from '../generated.tsx';
import { PropertiesDetail } from './properties-detail.tsx';

const communityId = '65f1f77bcf86cd7994390001';
const memberId = '65f1f77bcf86cd7994390002';
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
				listedForSale: false,
				listedForRent: false,
				listedForLease: false,
				listedInDirectory: false,
				tags: [],
				owner: null,
				location: null,
				listingDetail: {
					__typename: 'PropertyListingDetail',
					price: null,
					rentHigh: null,
					rentLow: null,
					lease: null,
					maxGuests: null,
					bedrooms: 3,
					bathrooms: 2.5,
					squareFeet: 1750,
					yearBuilt: null,
					lotSize: null,
					description: null,
					amenities: [],
					bedroomDetails: [],
					additionalAmenities: [],
					images: [],
					video: null,
					floorPlan: null,
					floorPlanImages: [],
					listingAgent: null,
					listingAgentPhone: null,
					listingAgentEmail: null,
					listingAgentWebsite: null,
					listingAgentCompany: null,
					listingAgentCompanyPhone: null,
					listingAgentCompanyEmail: null,
					listingAgentCompanyWebsite: null,
					listingAgentCompanyAddress: null,
				},
				createdAt: '2024-01-01T12:00:00.000Z',
				updatedAt: '2024-01-15T12:00:00.000Z',
			},
		},
	},
};

const membersMock = {
	request: {
		query: AdminMemberListContainerMembersDocument,
		variables: { communityId },
	},
	result: {
		data: {
			membersByCommunityId: [
				{
					__typename: 'Member',
					id: memberId,
					memberName: 'Alice Property Manager',
					isAdmin: true,
					accounts: [
						{
							__typename: 'MemberAccount',
							id: '65f1f77bcf86cd7994390003',
							firstName: 'Alice',
							lastName: 'Manager',
							statusCode: 'ACCEPTED',
							user: {
								__typename: 'EndUser',
								id: '65f1f77bcf86cd7994390004',
								externalId: 'f9c2d0e1-0000-4000-8000-000000000001',
							},
							createdAt: '2024-01-01T00:00:00.000Z',
							updatedAt: '2024-01-01T00:00:00.000Z',
						},
					],
					profile: {
						__typename: 'MemberProfile',
						name: 'Alice Property Manager',
						email: 'alice@example.com',
						bio: null,
						showEmail: false,
						showProfile: true,
					},
					createdAt: '2024-01-01T00:00:00.000Z',
					updatedAt: '2024-01-01T00:00:00.000Z',
				},
			],
			memberForCurrentCommunity: {
				__typename: 'Member',
				id: memberId,
			},
		},
	},
};

const routerDecorator = (mocks: Parameters<typeof MockedProvider>[0]['mocks']) => {
	const Decorator = (Story: React.ComponentType) => (
		<HelmetProvider>
			<MockedProvider mocks={mocks}>
				<AntdApp>
					<MemoryRouter initialEntries={[`/community/${communityId}/admin/${memberId}/properties/${propertyId}`]}>
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
	decorators: [routerDecorator([propertyQueryMock, membersMock])],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Page header plus the populated edit form
		expect(canvas.getByText('Property Details')).toBeInTheDocument();
		expect(await canvas.findByLabelText('Property Name')).toHaveValue('Harborview Unit 205');
		expect(canvas.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
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
			membersMock,
		]),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		expect(await canvas.findByText('Property Not Found')).toBeInTheDocument();
	},
};
