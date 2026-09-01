import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App, ConfigProvider } from 'antd';
import type React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MemberPropertiesListDocument } from '../generated.tsx';
import { MemberPropertiesAccessProvider } from './member-properties-access.context.ts';
import { MemberPropertiesListContainer } from './member-properties-list.container.tsx';

const communityId = '65f1f77bcf86cd7994390001';
const memberId = '65f1f77bcf86cd7994390002';

const listMock = (propertiesByCommunityId: unknown[]) => ({
	request: { query: MemberPropertiesListDocument, variables: { communityId } },
	result: { data: { propertiesByCommunityId } },
});

const decoratorFor = (mocks: ReturnType<typeof listMock>[]) => (Story: React.ComponentType) => (
	<ConfigProvider>
		<App>
			<MockedProvider mocks={mocks}>
				<MemoryRouter>
					<MemberPropertiesAccessProvider value={{ communityId, memberId, revalidate: async () => undefined }}>
						<Story />
					</MemberPropertiesAccessProvider>
				</MemoryRouter>
			</MockedProvider>
		</App>
	</ConfigProvider>
);

const meta = {
	title: 'Components/Member/MemberPropertiesListContainer',
	component: MemberPropertiesListContainer,
} satisfies Meta<typeof MemberPropertiesListContainer>;

export default meta;
type Story = StoryObj<typeof MemberPropertiesListContainer>;

export const Allowed: Story = {
	decorators: [
		decoratorFor([
			listMock([
				{
					__typename: 'Property',
					id: '65f1f77bcf86cd7994390101',
					propertyName: 'Neighbor Cottage',
					propertyType: 'condo',
					listingDetail: null,
					location: null,
					updatedAt: null,
				},
			]),
		]),
	],
};

export const Empty: Story = {
	decorators: [decoratorFor([listMock([])])],
};

export const QueryError: Story = {
	decorators: [decoratorFor([{ request: { query: MemberPropertiesListDocument, variables: { communityId } }, error: new Error('Unable to load properties') }])],
};
