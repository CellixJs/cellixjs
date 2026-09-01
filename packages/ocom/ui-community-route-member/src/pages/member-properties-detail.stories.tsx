import { MockedProvider } from '@apollo/client/testing';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App as AntdApp } from 'antd';
import type React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MemberPropertiesAccessProvider } from '../components/member-properties-access.context.ts';
import { MemberPropertyDetailDocument } from '../generated.tsx';
import { MemberPropertiesDetailPage } from './member-properties-detail.tsx';

const communityId = '65f1f77bcf86cd7994390001';
const memberId = '65f1f77bcf86cd7994390002';
const propertyId = '65f1f77bcf86cd7994390101';

const propertyMock = (ownerId: string) => ({
	request: { query: MemberPropertyDetailDocument, variables: { id: propertyId } },
	result: {
		data: {
			property: {
				__typename: 'Property',
				id: propertyId,
				propertyName: 'Neighbor Cottage',
				propertyType: 'cottage',
				listedForSale: true,
				listedForRent: false,
				listedForLease: false,
				listedInDirectory: true,
				tags: ['garden'],
				owner: { __typename: 'PropertyOwnerOption', id: ownerId },
				location: null,
				listingDetail: null,
				createdAt: '2024-01-01T12:00:00.000Z',
				updatedAt: '2024-01-15T12:00:00.000Z',
			},
		},
	},
});

const decoratorFor = (mocks: Parameters<typeof MockedProvider>[0]['mocks']) => (Story: React.ComponentType) => (
	<HelmetProvider>
		<AntdApp>
			<MockedProvider mocks={mocks}>
				<MemoryRouter initialEntries={[`/community/${communityId}/member/${memberId}/properties/${propertyId}`]}>
					<MemberPropertiesAccessProvider value={{ communityId, memberId, revalidate: async () => undefined }}>
						<Routes>
							<Route
								path="/community/:communityId/member/:memberId/properties/:id"
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
	title: 'Pages/Member/PropertiesDetail',
	component: MemberPropertiesDetailPage,
	parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MemberPropertiesDetailPage>;

export default meta;
type Story = StoryObj<typeof MemberPropertiesDetailPage>;

export const OwnedEditable: Story = {
	decorators: [decoratorFor([propertyMock(memberId)])],
};

export const ForeignReadOnly: Story = {
	decorators: [decoratorFor([propertyMock('65f1f77bcf86cd7994390003')])],
};
