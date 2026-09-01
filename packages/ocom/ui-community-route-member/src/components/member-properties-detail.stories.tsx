import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App, ConfigProvider } from 'antd';
import type React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MemberPropertyDetailDocument } from '../generated.tsx';
import { MemberPropertiesAccessProvider } from './member-properties-access.context.ts';
import { MemberPropertiesDetailContainer } from './member-properties-detail.container.tsx';

const communityId = '65f1f77bcf86cd7994390001';
const ownMemberId = '65f1f77bcf86cd7994390002';
const propertyId = '65f1f77bcf86cd7994390101';

const property = (ownerId: string) => ({
	__typename: 'Property' as const,
	id: propertyId,
	propertyName: 'Harborview Unit 205',
	propertyType: 'condo',
	listedForSale: true,
	listedForRent: false,
	listedForLease: false,
	listedInDirectory: true,
	tags: ['waterfront'],
	owner: { __typename: 'PropertyOwnerOption' as const, id: ownerId },
	location: null,
	listingDetail: null,
	createdAt: null,
	updatedAt: null,
});

const detailMock = (result: unknown) => ({
	request: { query: MemberPropertyDetailDocument, variables: { id: propertyId } },
	result,
});

const decoratorFor = (mocks: ReturnType<typeof detailMock>[]) => (Story: React.ComponentType) => (
	<ConfigProvider>
		<App>
			<MockedProvider mocks={mocks}>
				<MemoryRouter initialEntries={[`/community/${communityId}/member/${ownMemberId}/properties/${propertyId}`]}>
					<MemberPropertiesAccessProvider value={{ communityId, memberId: ownMemberId, revalidate: async () => undefined }}>
						<Story />
					</MemberPropertiesAccessProvider>
				</MemoryRouter>
			</MockedProvider>
		</App>
	</ConfigProvider>
);

const meta = {
	title: 'Components/Member/MemberPropertiesDetailContainer',
	component: MemberPropertiesDetailContainer,
	args: { id: propertyId },
} satisfies Meta<typeof MemberPropertiesDetailContainer>;

export default meta;
type Story = StoryObj<typeof MemberPropertiesDetailContainer>;

export const OwnedEdit: Story = {
	decorators: [decoratorFor([detailMock({ data: { property: property(ownMemberId) } })])],
};

export const ForeignReadOnly: Story = {
	decorators: [decoratorFor([detailMock({ data: { property: property('65f1f77bcf86cd7994390003') } })])],
};

export const NotFound: Story = {
	decorators: [decoratorFor([detailMock({ data: { property: null } })])],
};

export const QueryError: Story = {
	decorators: [decoratorFor([{ request: { query: MemberPropertyDetailDocument, variables: { id: propertyId } }, error: new Error('Unable to load property') }])],
};
