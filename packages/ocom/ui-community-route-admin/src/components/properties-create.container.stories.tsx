import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App as AntdApp } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import type { PropertyCreateInput } from '../generated.tsx';
import { AdminPropertiesCreateContainerPropertyCreateDocument, AdminPropertiesListContainerPropertiesDocument, AdminPropertiesOwnerOptionsDocument } from '../generated.tsx';
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
	tags: [],
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
});

const membersMock = {
	request: {
		query: AdminPropertiesOwnerOptionsDocument,
		variables: { communityId },
	},
	result: {
		data: {
			propertyOwnerOptions: [
				{
					__typename: 'Member',
					id: memberId,
					memberName: 'Alice Property Manager',
				},
			],
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

export const SubmittingBlocksDuplicateCreates: Story = {
	decorators: [
		routerDecorator([
			membersMock,
			{
				request: {
					query: AdminPropertiesCreateContainerPropertyCreateDocument,
					variables: { input: emptyCreateInput('Twice Tapped') },
				},
				// Long enough that the in-flight loading state is reliably
				// observable even on slow CI agents, yet the story still fits
				// comfortably inside the default test timeout.
				delay: 2000,
				result: {
					data: {
						propertyCreate: {
							__typename: 'PropertyMutationResult',
							status: { __typename: 'MutationStatus', success: true, errorMessage: null },
							property: {
								__typename: 'Property',
								id: newPropertyId,
								propertyName: 'Twice Tapped',
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

		await userEvent.type(canvas.getByLabelText('Property Name'), 'Twice Tapped');
		const createButton = canvas.getByRole('button', { name: /create property/i });
		await userEvent.click(createButton);

		// While the delayed create is in flight the button reports loading, so
		// a second click cannot send another create request.
		await waitFor(() => expect(createButton).toHaveClass('ant-btn-loading'));
		// Guard against pathologically slow runners: if the create already
		// resolved, the container navigated away and the button is detached, in
		// which case the double-submit window has provably closed.
		if (createButton.isConnected) {
			await userEvent.click(createButton);
		}

		// The single mocked create resolves and the container navigates to the list;
		// a second request would have failed the MockedProvider (no matching mock).
		expect(await canvas.findByText('Properties List Route', undefined, { timeout: 6000 })).toBeInTheDocument();
	},
};
