import { MockedProvider } from '@apollo/client/testing';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App as AntdApp } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, within } from 'storybook/test';
import { AdminPropertiesListContainerPropertiesDocument, AdminSectionLayoutContainerMembersForCurrentEndUserDocument } from '../generated.tsx';
import { Properties } from './properties.tsx';

const communityId = '65f1f77bcf86cd7994390001';
const memberId = '65f1f77bcf86cd7994390002';
const currentEndUserId = '65f1f77bcf86cd7994390009';

const buildMembersMock = (canManageProperties: boolean) => ({
	request: {
		query: AdminSectionLayoutContainerMembersForCurrentEndUserDocument,
	},
	result: {
		data: {
			currentEndUserAndCreateIfNotExists: {
				__typename: 'EndUser',
				id: currentEndUserId,
			},
			membersForCurrentEndUser: [
				{
					__typename: 'Member',
					id: memberId,
					memberName: 'Alice Property Manager',
					isAdmin: true,
					accounts: [
						{
							__typename: 'MemberAccount',
							statusCode: 'ACCEPTED',
							user: {
								__typename: 'EndUser',
								id: currentEndUserId,
							},
						},
					],
					role: {
						__typename: 'EndUserRole',
						id: '65f1f77bcf86cd7994390003',
						permissions: {
							__typename: 'EndUserRolePermissions',
							isNonPropertyAdmin: false,
							propertyPermissions: {
								__typename: 'EndUserRolePropertyPermissions',
								canManageProperties,
							},
						},
					},
					community: {
						__typename: 'Community',
						id: communityId,
						name: 'Harborview HOA',
					},
				},
			],
		},
	},
});

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
						price: 450000,
						bedrooms: 2,
						bathrooms: 1.5,
						squareFeet: 1200,
					},
					location: {
						__typename: 'PropertyLocation',
						address: {
							__typename: 'PropertyAddress',
							streetNumber: '125',
							streetName: 'Harbor Way',
							municipality: 'Shorewood',
							countrySubdivision: 'WI',
							postalCode: '53211',
							country: 'USA',
						},
					},
					owner: {
						__typename: 'PropertyOwnerOption',
						id: memberId,
						memberName: 'Alice Property Manager',
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
				<AntdApp>
					<MemoryRouter initialEntries={[`/community/${communityId}/admin/${memberId}/properties`]}>
						<Routes>
							<Route
								path="/community/:communityId/admin/:memberId/properties/*"
								element={<Story />}
							/>
						</Routes>
					</MemoryRouter>
				</AntdApp>
			</MockedProvider>
		</HelmetProvider>
	);
	return Decorator;
};

const meta = {
	title: 'Pages/Admin/Properties',
	component: Properties,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof Properties>;

export default meta;
type Story = StoryObj<typeof Properties>;

export const AuthorizedList: Story = {
	decorators: [routerDecorator([buildMembersMock(true), propertiesListMock])],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Guard admits the member and the list page renders with data
		expect(await canvas.findByText('Community Properties (1)')).toBeInTheDocument();
		expect(canvas.getByText('Harborview Unit 101')).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: /add property/i })).toBeInTheDocument();
	},
};

export const PermissionDenied: Story = {
	decorators: [routerDecorator([buildMembersMock(false)])],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Deep links without canManageProperties are blocked with a 403 result
		expect(await canvas.findByText('403')).toBeInTheDocument();
		expect(canvas.getByText('Sorry, you are not authorized to manage properties for this community.')).toBeInTheDocument();
		expect(canvas.queryByRole('button', { name: /add property/i })).not.toBeInTheDocument();
	},
};
