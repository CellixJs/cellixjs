import { MockedProvider } from '@apollo/client/testing';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App as AntdApp } from 'antd';
import type React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MemberPropertiesListDocument, MemberPropertiesRouteGuardMembersForCurrentEndUserDocument } from '../generated.tsx';
import { MemberProperties } from './member-properties.tsx';

const communityId = '65f1f77bcf86cd7994390001';
const memberId = '65f1f77bcf86cd7994390002';
const currentEndUserId = '65f1f77bcf86cd7994390009';

const guardMock = (canEditOwnProperty: boolean) => ({
	request: { query: MemberPropertiesRouteGuardMembersForCurrentEndUserDocument },
	result: {
		data: {
			currentEndUserAndCreateIfNotExists: { __typename: 'EndUser', id: currentEndUserId },
			membersForCurrentEndUser: [
				{
					__typename: 'Member',
					id: memberId,
					accounts: [{ __typename: 'MemberAccount', statusCode: 'ACCEPTED', user: { __typename: 'EndUser', id: currentEndUserId } }],
					role: {
						__typename: 'EndUserRole',
						permissions: {
							__typename: 'EndUserRolePermissions',
							propertyPermissions: {
								__typename: 'EndUserRolePropertyPermissions',
								canManageProperties: false,
								canEditOwnProperty,
							},
						},
					},
					community: { __typename: 'Community', id: communityId },
				},
			],
		},
	},
});

const listMock = {
	request: { query: MemberPropertiesListDocument, variables: { communityId } },
	result: {
		data: {
			propertiesByCommunityId: [
				{
					__typename: 'Property',
					id: '65f1f77bcf86cd7994390101',
					propertyName: 'Neighbor Cottage',
					propertyType: 'cottage',
					listingDetail: null,
					location: null,
					updatedAt: null,
				},
			],
		},
	},
};

const decoratorFor = (mocks: Parameters<typeof MockedProvider>[0]['mocks']) => (Story: React.ComponentType) => (
	<HelmetProvider>
		<AntdApp>
			<MockedProvider mocks={mocks}>
				<MemoryRouter initialEntries={[`/community/${communityId}/member/${memberId}/properties`]}>
					<Routes>
						<Route
							path="/community/:communityId/member/:memberId/properties/*"
							element={<Story />}
						/>
					</Routes>
				</MemoryRouter>
			</MockedProvider>
		</AntdApp>
	</HelmetProvider>
);

const meta = {
	title: 'Pages/Member/Properties',
	component: MemberProperties,
	parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MemberProperties>;

export default meta;
type Story = StoryObj<typeof MemberProperties>;

export const AuthorizedList: Story = {
	decorators: [decoratorFor([guardMock(true), listMock])],
};

export const PermissionDenied: Story = {
	decorators: [decoratorFor([guardMock(false)])],
};
