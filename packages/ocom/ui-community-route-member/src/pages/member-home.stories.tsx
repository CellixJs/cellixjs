import { MockedProvider } from '@apollo/client/testing';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App as AntdApp } from 'antd';
import type React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MemberPropertiesRouteGuardMembersForCurrentEndUserDocument } from '../generated.tsx';
import { MemberHome } from './member-home.tsx';

const communityId = '65f1f77bcf86cd7994390001';
const memberId = '65f1f77bcf86cd7994390002';
const currentEndUserId = '65f1f77bcf86cd7994390009';

const membershipMock = (canEditOwnProperty: boolean, canManageProperties = false) => ({
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
								canManageProperties,
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

const decoratorFor = (mocks: Parameters<typeof MockedProvider>[0]['mocks']) => (Story: React.ComponentType) => (
	<HelmetProvider>
		<AntdApp>
			<MockedProvider mocks={mocks}>
				<MemoryRouter initialEntries={[`/community/${communityId}/member/${memberId}`]}>
					<Routes>
						<Route
							path="/community/:communityId/member/:memberId"
							element={<Story />}
						/>
					</Routes>
				</MemoryRouter>
			</MockedProvider>
		</AntdApp>
	</HelmetProvider>
);

const meta = {
	title: 'Pages/Member/Home',
	component: MemberHome,
	parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MemberHome>;

export default meta;
type Story = StoryObj<typeof MemberHome>;

export const OwnPropertyMember: Story = {
	decorators: [decoratorFor([membershipMock(true)])],
};

export const PropertyManager: Story = {
	decorators: [decoratorFor([membershipMock(false, true)])],
};

export const NoPropertyPermission: Story = {
	decorators: [decoratorFor([membershipMock(false)])],
};
