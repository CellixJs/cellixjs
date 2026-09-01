import { MockedProvider } from '@apollo/client/testing';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App as AntdApp } from 'antd';
import type React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MemberPropertiesAccessProvider } from '../components/member-properties-access.context.ts';
import { MemberPropertiesListDocument } from '../generated.tsx';
import { MemberPropertiesListPage } from './member-properties-list.tsx';

const communityId = '65f1f77bcf86cd7994390001';
const memberId = '65f1f77bcf86cd7994390002';

const listMock = (propertiesByCommunityId: unknown[]) => ({
	request: { query: MemberPropertiesListDocument, variables: { communityId } },
	result: { data: { propertiesByCommunityId } },
});

const decoratorFor = (mocks: Parameters<typeof MockedProvider>[0]['mocks']) => (Story: React.ComponentType) => (
	<HelmetProvider>
		<AntdApp>
			<MockedProvider mocks={mocks}>
				<MemoryRouter initialEntries={[`/community/${communityId}/member/${memberId}/properties`]}>
					<MemberPropertiesAccessProvider value={{ communityId, memberId, revalidate: async () => undefined }}>
						<Routes>
							<Route
								path="/community/:communityId/member/:memberId/properties"
								element={<Story />}
							/>
						</Routes>
					</MemberPropertiesAccessProvider>
				</MemoryRouter>
			</MockedProvider>
		</AntdApp>
	</HelmetProvider>
);

const meta = {
	title: 'Pages/Member/PropertiesList',
	component: MemberPropertiesListPage,
	parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MemberPropertiesListPage>;

export default meta;
type Story = StoryObj<typeof MemberPropertiesListPage>;

export const Default: Story = {
	decorators: [
		decoratorFor([
			listMock([
				{
					__typename: 'Property',
					id: '65f1f77bcf86cd7994390101',
					propertyName: 'Neighbor Cottage',
					propertyType: 'cottage',
					listingDetail: { __typename: 'PropertyListingDetail', price: 350000, bedrooms: 3, bathrooms: 2, squareFeet: 1800 },
					location: {
						__typename: 'PropertyLocation',
						address: {
							__typename: 'PropertyAddress',
							streetNumber: '20',
							streetName: 'Pine Lane',
							municipality: 'Shorewood',
							countrySubdivision: 'WI',
							postalCode: '53211',
							country: 'USA',
						},
					},
					updatedAt: '2024-01-15T12:00:00.000Z',
				},
			]),
		]),
	],
};

export const Empty: Story = {
	decorators: [decoratorFor([listMock([])])],
};
