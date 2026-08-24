import { InMemoryCache } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App as AntdApp } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, userEvent, within } from 'storybook/test';
import {
	AdminPropertiesDetailContainerPropertyDeleteDocument,
	AdminPropertiesDetailContainerPropertyDocument,
	AdminPropertiesDetailContainerPropertyUpdateDocument,
	AdminPropertiesListContainerPropertiesDocument,
	AdminPropertiesOwnerOptionsDocument,
	type PropertyUpdateInput,
} from '../generated.tsx';
import { PropertiesDetailContainer } from './properties-detail.container.tsx';

const communityId = '65f1f77bcf86cd7994390001';
const memberId = '65f1f77bcf86cd7994390002';
const propertyId = '65f1f77bcf86cd7994390201';

const mockProperty = {
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
};

/** The full update input the form submits for `mockProperty` when nothing is edited. */
const baseUpdateInput = (): PropertyUpdateInput => ({
	id: propertyId,
	propertyName: 'Harborview Unit 205',
	propertyType: 'condo',
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
});

const membersMock = {
	request: {
		query: AdminPropertiesOwnerOptionsDocument,
		variables: { communityId },
	},
	maxUsageCount: Number.POSITIVE_INFINITY,
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

const propertyQueryMock = {
	request: {
		query: AdminPropertiesDetailContainerPropertyDocument,
		variables: { id: propertyId },
	},
	result: {
		data: {
			property: mockProperty,
		},
	},
};

const routerDecorator = (mocks: Parameters<typeof MockedProvider>[0]['mocks'], cache?: InMemoryCache) => {
	const Decorator = (Story: React.ComponentType) => (
		<MockedProvider
			mocks={mocks}
			{...(cache ? { cache } : {})}
		>
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
	);
	return Decorator;
};

const meta = {
	title: 'Components/Layouts/Admin/PropertiesDetailContainer',
	component: PropertiesDetailContainer,
	parameters: {
		layout: 'padded',
	},
	args: {
		data: { id: propertyId },
	},
} satisfies Meta<typeof PropertiesDetailContainer>;

export default meta;
type Story = StoryObj<typeof PropertiesDetailContainer>;

export const Success: Story = {
	decorators: [routerDecorator([propertyQueryMock, membersMock])],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		expect(await canvas.findByLabelText('Property Name')).toHaveValue('Harborview Unit 205');
		expect(canvas.getByLabelText('Property Type')).toHaveValue('condo');
		expect(canvas.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
		// The details screen offers Save & Close next to Save
		expect(canvas.getByRole('button', { name: /save & close/i })).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: /remove property/i })).toBeInTheDocument();
	},
};

export const Loading: Story = {
	decorators: [
		routerDecorator([
			{
				...propertyQueryMock,
				delay: 1_000_000,
			},
			membersMock,
		]),
	],
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		expect(canvas.queryByLabelText('Property Name')).not.toBeInTheDocument();
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

export const ErrorState: Story = {
	decorators: [
		routerDecorator([
			{
				request: {
					query: AdminPropertiesDetailContainerPropertyDocument,
					variables: { id: propertyId },
				},
				error: new Error('Failed to load property'),
			},
			membersMock,
		]),
	],
	play: async ({ canvasElement }) => {
		const body = within(canvasElement.ownerDocument.body);

		const errorToasts = await body.findAllByText(/Failed to load property/i);
		expect(errorToasts.length).toBeGreaterThan(0);
	},
};

export const RemoveFlow: Story = {
	decorators: [
		routerDecorator([
			propertyQueryMock,
			membersMock,
			{
				request: {
					query: AdminPropertiesDetailContainerPropertyDeleteDocument,
					variables: { input: { id: propertyId } },
				},
				result: {
					data: {
						propertyDelete: {
							__typename: 'PropertyMutationResult',
							status: { __typename: 'MutationStatus', success: true, errorMessage: null },
						},
					},
				},
			},
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
		const body = within(canvasElement.ownerDocument.body);

		await userEvent.click(await canvas.findByRole('button', { name: /remove property/i }));

		// Confirm the removal through the confirmation modal
		await body.findByText('Remove this property?');
		const confirmButton = body.getAllByRole('button', { name: /remove property/i }).find((button) => button.closest('.ant-modal-footer'));
		expect(confirmButton).toBeDefined();
		await userEvent.click(confirmButton as HTMLElement);

		// After the delete succeeds, the container navigates back to the list
		expect(await canvas.findByText('Properties List Route')).toBeInTheDocument();
	},
};

const evictionCache = new InMemoryCache();

export const RemoveEvictsCachedProperty: Story = {
	decorators: [
		routerDecorator(
			[
				propertyQueryMock,
				membersMock,
				{
					request: {
						query: AdminPropertiesDetailContainerPropertyDeleteDocument,
						variables: { input: { id: propertyId } },
					},
					result: {
						data: {
							propertyDelete: {
								__typename: 'PropertyMutationResult',
								status: { __typename: 'MutationStatus', success: true, errorMessage: null },
							},
						},
					},
				},
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
			],
			evictionCache,
		),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);

		await canvas.findByLabelText('Property Name');
		expect(Object.keys(evictionCache.extract())).toContain(`Property:${propertyId}`);

		await userEvent.click(await canvas.findByRole('button', { name: /remove property/i }));
		await body.findByText('Remove this property?');
		const confirmButton = body.getAllByRole('button', { name: /remove property/i }).find((button) => button.closest('.ant-modal-footer'));
		expect(confirmButton).toBeDefined();
		await userEvent.click(confirmButton as HTMLElement);

		expect(await canvas.findByText('Properties List Route')).toBeInTheDocument();
		// The deleted property must be evicted so stale details cannot be served from cache
		expect(Object.keys(evictionCache.extract())).not.toContain(`Property:${propertyId}`);
	},
};

export const SaveClearedNumericFieldsSendsNulls: Story = {
	decorators: [
		routerDecorator([
			propertyQueryMock,
			membersMock,
			{
				request: {
					query: AdminPropertiesDetailContainerPropertyUpdateDocument,
					variables: {
						input: {
							...baseUpdateInput(),
							listingDetail: {
								...baseUpdateInput().listingDetail,
								bedrooms: null,
								bathrooms: null,
								squareFeet: null,
							},
						},
					},
				},
				result: {
					data: {
						propertyUpdate: {
							__typename: 'PropertyMutationResult',
							status: { __typename: 'MutationStatus', success: true, errorMessage: null },
							property: {
								...mockProperty,
								listingDetail: {
									...mockProperty.listingDetail,
									bedrooms: null,
									bathrooms: null,
									squareFeet: null,
								},
							},
						},
					},
				},
			},
		]),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);

		await canvas.findByLabelText('Property Name');
		for (const label of ['Bedrooms', 'Bathrooms', 'Square Feet']) {
			const field = canvas.getByLabelText(label);
			await userEvent.clear(field);
		}
		await userEvent.click(canvas.getByRole('button', { name: /^save$/i }));

		// The success toast only appears when the mutation variables carried explicit nulls
		expect(await body.findByText('Saved')).toBeInTheDocument();
	},
};

const untypedPropertyQueryMock = {
	request: {
		query: AdminPropertiesDetailContainerPropertyDocument,
		variables: { id: propertyId },
	},
	result: {
		data: {
			property: { ...mockProperty, propertyType: null },
		},
	},
};

export const SaveClearsPropertyTypeWithNull: Story = {
	decorators: [
		routerDecorator([
			untypedPropertyQueryMock,
			membersMock,
			{
				request: {
					query: AdminPropertiesDetailContainerPropertyUpdateDocument,
					variables: {
						input: {
							...baseUpdateInput(),
							propertyType: null,
						},
					},
				},
				result: {
					data: {
						propertyUpdate: {
							__typename: 'PropertyMutationResult',
							status: { __typename: 'MutationStatus', success: true, errorMessage: null },
							property: { ...mockProperty, propertyType: null },
						},
					},
				},
			},
		]),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);

		// Touch the empty property type and clear it again so the form submits ''
		const propertyType = await canvas.findByLabelText('Property Type');
		await userEvent.type(propertyType, 'x');
		await userEvent.clear(propertyType);
		await userEvent.click(canvas.getByRole('button', { name: /^save$/i }));

		// The success toast only appears when the cleared property type was sent
		// as an explicit null, which the backend persists as a cleared value.
		expect(await body.findByText('Saved')).toBeInTheDocument();
	},
};

const failedDeleteCache = new InMemoryCache();

export const RemoveFailureKeepsCachedProperty: Story = {
	decorators: [
		routerDecorator(
			[
				propertyQueryMock,
				membersMock,
				{
					request: {
						query: AdminPropertiesDetailContainerPropertyDeleteDocument,
						variables: { input: { id: propertyId } },
					},
					result: {
						data: {
							propertyDelete: {
								__typename: 'PropertyMutationResult',
								status: { __typename: 'MutationStatus', success: false, errorMessage: 'Cannot remove this property' },
							},
						},
					},
				},
			],
			failedDeleteCache,
		),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);

		await canvas.findByLabelText('Property Name');
		expect(Object.keys(failedDeleteCache.extract())).toContain(`Property:${propertyId}`);

		await userEvent.click(await canvas.findByRole('button', { name: /remove property/i }));
		await body.findByText('Remove this property?');
		const confirmButton = body.getAllByRole('button', { name: /remove property/i }).find((button) => button.closest('.ant-modal-footer'));
		expect(confirmButton).toBeDefined();
		await userEvent.click(confirmButton as HTMLElement);

		expect(await body.findByText('Cannot remove this property')).toBeInTheDocument();
		// A failed deletion must not evict the property or leave the detail page
		expect(Object.keys(failedDeleteCache.extract())).toContain(`Property:${propertyId}`);
		expect(canvas.getByLabelText('Property Name')).toBeInTheDocument();
	},
};

export const RemoveSucceedsEvenIfListRefetchFails: Story = {
	decorators: [
		routerDecorator([
			propertyQueryMock,
			membersMock,
			{
				request: {
					query: AdminPropertiesDetailContainerPropertyDeleteDocument,
					variables: { input: { id: propertyId } },
				},
				result: {
					data: {
						propertyDelete: {
							__typename: 'PropertyMutationResult',
							status: { __typename: 'MutationStatus', success: true, errorMessage: null },
						},
					},
				},
			},
			{
				request: {
					query: AdminPropertiesListContainerPropertiesDocument,
					variables: { communityId },
				},
				result: {
					errors: [{ message: 'list refetch unavailable' }],
				},
			},
		]),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);

		await userEvent.click(await canvas.findByRole('button', { name: /remove property/i }));
		await body.findByText('Remove this property?');
		const confirmButton = body.getAllByRole('button', { name: /remove property/i }).find((button) => button.closest('.ant-modal-footer'));
		expect(confirmButton).toBeDefined();
		await userEvent.click(confirmButton as HTMLElement);

		// The deletion itself succeeded, so a refetch failure must not surface as a failed removal
		expect(await body.findByText('Property Removed')).toBeInTheDocument();
		expect(await canvas.findByText('Properties List Route')).toBeInTheDocument();
	},
};

export const SaveAndCloseNavigatesToList: Story = {
	decorators: [
		routerDecorator([
			propertyQueryMock,
			membersMock,
			{
				request: {
					query: AdminPropertiesDetailContainerPropertyUpdateDocument,
					variables: { input: baseUpdateInput() },
				},
				result: {
					data: {
						propertyUpdate: {
							__typename: 'PropertyMutationResult',
							status: { __typename: 'MutationStatus', success: true, errorMessage: null },
							property: mockProperty,
						},
					},
				},
			},
		]),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);

		await canvas.findByLabelText('Property Name');
		await userEvent.click(canvas.getByRole('button', { name: /save & close/i }));

		// Save & Close saves first, then returns to the properties list
		expect(await body.findByText('Saved')).toBeInTheDocument();
		expect(await canvas.findByText('Properties List Route')).toBeInTheDocument();
	},
};

export const SaveAndCloseFailureStaysOnDetails: Story = {
	decorators: [
		routerDecorator([
			propertyQueryMock,
			membersMock,
			{
				request: {
					query: AdminPropertiesDetailContainerPropertyUpdateDocument,
					variables: { input: baseUpdateInput() },
				},
				result: {
					data: {
						propertyUpdate: {
							__typename: 'PropertyMutationResult',
							status: { __typename: 'MutationStatus', success: false, errorMessage: 'Cannot update this property' },
							property: null,
						},
					},
				},
			},
		]),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);

		await canvas.findByLabelText('Property Name');
		await userEvent.click(canvas.getByRole('button', { name: /save & close/i }));

		// A failed save surfaces the backend message and must not navigate away
		expect(await body.findByText('Cannot update this property')).toBeInTheDocument();
		expect(canvas.getByLabelText('Property Name')).toBeInTheDocument();
		expect(canvas.queryByText('Properties List Route')).not.toBeInTheDocument();
	},
};
