import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App as AntdApp } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, userEvent, within } from 'storybook/test';
import type { PropertyCreateInput } from '../generated.tsx';
import { AdminMemberListContainerMembersDocument, AdminPropertiesCreateContainerPropertyCreateDocument, AdminPropertiesListContainerPropertiesDocument } from '../generated.tsx';
import { PropertiesCreateContainer } from './properties-create.container.tsx';

const communityId = '65f1f77bcf86cd7994390001';
const memberId = '65f1f77bcf86cd7994390002';
const newPropertyId = '65f1f77bcf86cd7994390110';

/** The full create input the form submits when only the property name is filled in. */
const emptyCreateInput = (propertyName: string): PropertyCreateInput => ({
	propertyName,
	propertyType: null,
	ownerId: null,
	listedForSale: false,
	listedForRent: false,
	listedForLease: false,
	listedInDirectory: false,
	tags: null,
	location: {
		address: {
			streetNumber: null,
			streetName: null,
			municipality: null,
			countrySubdivision: null,
			postalCode: null,
			country: null,
		},
	},
	listingDetail: {
		price: null,
		rentHigh: null,
		rentLow: null,
		lease: null,
		maxGuests: null,
		bedrooms: null,
		bathrooms: null,
		squareFeet: null,
		yearBuilt: null,
		lotSize: null,
		description: null,
		amenities: null,
		bedroomDetails: [],
		additionalAmenities: [],
		images: null,
		video: null,
		floorPlan: null,
		floorPlanImages: null,
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
});

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

const listRefetchMock = {
	request: {
		query: AdminPropertiesListContainerPropertiesDocument,
		variables: { communityId },
	},
	result: {
		data: {
			propertiesByCommunityId: [],
		},
	},
};

const routerDecorator = (mocks: Parameters<typeof MockedProvider>[0]['mocks']) => {
	const Decorator = (Story: React.ComponentType) => (
		<MockedProvider mocks={mocks}>
			<AntdApp>
				<MemoryRouter initialEntries={[`/community/${communityId}/admin/${memberId}/properties/create`]}>
					<Routes>
						<Route path="/community/:communityId/admin/:memberId/properties">
							<Route
								path=""
								element={<div>Properties List Route</div>}
							/>
							<Route
								path="create"
								element={<Story />}
							/>
							<Route
								path=":id/*"
								element={<div>Property Detail Route</div>}
							/>
						</Route>
					</Routes>
				</MemoryRouter>
			</AntdApp>
		</MockedProvider>
	);
	return Decorator;
};

const meta = {
	title: 'Components/Layouts/Admin/PropertiesCreateContainer',
	component: PropertiesCreateContainer,
	parameters: {
		layout: 'padded',
	},
	args: {
		data: { communityId },
	},
} satisfies Meta<typeof PropertiesCreateContainer>;

export default meta;
type Story = StoryObj<typeof PropertiesCreateContainer>;

export const Default: Story = {
	decorators: [routerDecorator([membersMock])],
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		expect(canvas.getByLabelText('Property Name')).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: /create property/i })).toBeInTheDocument();
	},
};

export const Success: Story = {
	decorators: [
		routerDecorator([
			membersMock,
			{
				request: {
					query: AdminPropertiesCreateContainerPropertyCreateDocument,
					variables: { input: emptyCreateInput('Clubhouse Cottage') },
				},
				result: {
					data: {
						propertyCreate: {
							__typename: 'PropertyMutationResult',
							status: { __typename: 'MutationStatus', success: true, errorMessage: null },
							property: {
								__typename: 'Property',
								id: newPropertyId,
								propertyName: 'Clubhouse Cottage',
								createdAt: '2024-01-01T12:00:00.000Z',
								updatedAt: '2024-01-01T12:00:00.000Z',
							},
						},
					},
				},
			},
			listRefetchMock,
		]),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await userEvent.type(canvas.getByLabelText('Property Name'), 'Clubhouse Cottage');
		await userEvent.click(canvas.getByRole('button', { name: /create property/i }));

		// On success the container navigates back to the properties list
		expect(await canvas.findByText('Properties List Route')).toBeInTheDocument();
	},
};

export const MutationFailure: Story = {
	decorators: [
		routerDecorator([
			membersMock,
			{
				request: {
					query: AdminPropertiesCreateContainerPropertyCreateDocument,
					variables: { input: emptyCreateInput('Duplicate Property') },
				},
				result: {
					data: {
						propertyCreate: {
							__typename: 'PropertyMutationResult',
							status: { __typename: 'MutationStatus', success: false, errorMessage: 'Property name already in use' },
							property: null,
						},
					},
				},
			},
		]),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await userEvent.type(canvas.getByLabelText('Property Name'), 'Duplicate Property');
		await userEvent.click(canvas.getByRole('button', { name: /create property/i }));

		const body = within(canvasElement.ownerDocument.body);
		expect(await body.findByText('Property name already in use')).toBeInTheDocument();
	},
};

export const NetworkError: Story = {
	decorators: [
		routerDecorator([
			membersMock,
			{
				request: {
					query: AdminPropertiesCreateContainerPropertyCreateDocument,
					variables: { input: emptyCreateInput('Unlucky Property') },
				},
				error: new Error('Network unavailable'),
			},
		]),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await userEvent.type(canvas.getByLabelText('Property Name'), 'Unlucky Property');
		await userEvent.click(canvas.getByRole('button', { name: /create property/i }));

		const body = within(canvasElement.ownerDocument.body);
		expect(await body.findByText(/Network unavailable/i)).toBeInTheDocument();
	},
};
