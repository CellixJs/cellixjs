import { MockedProvider } from '@apollo/client/testing';
import type { MemberPropertyCreateInput } from '@ocom/ui-community-shared';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App, ConfigProvider } from 'antd';
import type React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, userEvent, within } from 'storybook/test';
import { MemberPropertiesListDocument, MemberPropertyCreateDocument } from '../generated.tsx';
import { MemberPropertiesAccessProvider } from './member-properties-access.context.ts';
import { MemberPropertiesCreateContainer } from './member-properties-create.container.tsx';

const communityId = '65f1f77bcf86cd7994390001';
const memberId = '65f1f77bcf86cd7994390002';

const emptyMemberCreateInput = (propertyName: string): MemberPropertyCreateInput => ({
	propertyName,
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

const listRefetchMock = {
	request: { query: MemberPropertiesListDocument, variables: { communityId } },
	result: { data: { propertiesByCommunityId: [] } },
};

const decoratorFor = (mocks: Parameters<typeof MockedProvider>[0]['mocks']) => (Story: React.ComponentType) => (
	<ConfigProvider>
		<App>
			<MockedProvider mocks={mocks}>
				<MemoryRouter initialEntries={[`/community/${communityId}/member/${memberId}/properties/create`]}>
					<MemberPropertiesAccessProvider value={{ communityId, memberId, revalidate: async () => undefined }}>
						<Routes>
							<Route path="/community/:communityId/member/:memberId/properties">
								<Route
									index
									element={<div>Properties List Route</div>}
								/>
								<Route
									path="create"
									element={<Story />}
								/>
							</Route>
						</Routes>
					</MemberPropertiesAccessProvider>
				</MemoryRouter>
			</MockedProvider>
		</App>
	</ConfigProvider>
);

const meta = {
	title: 'Components/Member/MemberPropertiesCreateContainer',
	component: MemberPropertiesCreateContainer,
	parameters: { layout: 'padded' },
} satisfies Meta<typeof MemberPropertiesCreateContainer>;

export default meta;
type Story = StoryObj<typeof MemberPropertiesCreateContainer>;

/** The member create form deliberately excludes manager-owned type and owner controls. */
export const Default: Story = {
	decorators: [decoratorFor([])],
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		expect(canvas.getByLabelText('Property Name')).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: /create property/i })).toBeInTheDocument();
		expect(canvas.queryByLabelText('Property Type')).not.toBeInTheDocument();
		expect(canvas.queryByLabelText('Owner')).not.toBeInTheDocument();
	},
};

export const Success: Story = {
	decorators: [
		decoratorFor([
			{
				request: { query: MemberPropertyCreateDocument, variables: { input: emptyMemberCreateInput('Member Cottage') } },
				result: {
					data: {
						propertyCreate: {
							__typename: 'PropertyMutationResult',
							status: { __typename: 'MutationStatus', success: true, errorMessage: null },
							property: {
								__typename: 'Property',
								id: '65f1f77bcf86cd7994390110',
								propertyName: 'Member Cottage',
								owner: { __typename: 'PropertyOwnerOption', id: memberId },
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
		await userEvent.type(canvas.getByLabelText('Property Name'), 'Member Cottage');
		await userEvent.click(canvas.getByRole('button', { name: /create property/i }));
		expect(await canvas.findByText('Properties List Route')).toBeInTheDocument();
	},
};

/** Mutation errors remain in the member form and display feedback without exposing manager controls. */
export const MutationError: Story = {
	decorators: [
		decoratorFor([
			{
				request: { query: MemberPropertyCreateDocument, variables: { input: emptyMemberCreateInput('Duplicate Cottage') } },
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
		await userEvent.type(canvas.getByLabelText('Property Name'), 'Duplicate Cottage');
		await userEvent.click(canvas.getByRole('button', { name: /create property/i }));
		const body = within(canvasElement.ownerDocument.body);
		expect(await body.findByText('Property name already in use')).toBeInTheDocument();
		expect(canvas.queryByLabelText('Owner')).not.toBeInTheDocument();
	},
};
