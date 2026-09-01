import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App, ConfigProvider } from 'antd';
import type React from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { MemberPropertiesRouteGuardMembersForCurrentEndUserDocument } from '../generated.tsx';
import { MemberPropertiesRouteGuardContainer } from './member-properties-route-guard.container.tsx';

const communityId = '65f1f77bcf86cd7994390001';
const memberId = '65f1f77bcf86cd7994390002';
const currentEndUserId = '65f1f77bcf86cd7994390009';
interface GuardOptions {
	canEditOwnProperty?: boolean;
	canManageProperties?: boolean;
	accountStatus?: string;
	routeMemberId?: string;
	routeCommunityId?: string;
}

const guardMock = (options: GuardOptions = {}) => ({
	request: { query: MemberPropertiesRouteGuardMembersForCurrentEndUserDocument },
	result: {
		data: {
			currentEndUserAndCreateIfNotExists: { __typename: 'EndUser', id: currentEndUserId },
			membersForCurrentEndUser: [
				{
					__typename: 'Member',
					id: memberId,
					accounts: [{ __typename: 'MemberAccount', statusCode: options.accountStatus ?? 'ACCEPTED', user: { __typename: 'EndUser', id: currentEndUserId } }],
					role: {
						__typename: 'EndUserRole',
						permissions: {
							__typename: 'EndUserRolePermissions',
							propertyPermissions: {
								__typename: 'EndUserRolePropertyPermissions',
								canManageProperties: options.canManageProperties ?? false,
								canEditOwnProperty: options.canEditOwnProperty ?? true,
							},
						},
					},
					community: { __typename: 'Community', id: communityId },
				},
			],
		},
	},
});

const RouteOutput: React.FC = () => {
	const location = useLocation();
	return <output>{location.pathname}</output>;
};

const decoratorFor = (options: GuardOptions = {}) => {
	const path = `/community/${options.routeCommunityId ?? communityId}/member/${options.routeMemberId ?? memberId}/properties`;
	return (Story: React.ComponentType) => (
		<ConfigProvider>
			<App>
				<MockedProvider mocks={[guardMock(options)]}>
					<MemoryRouter initialEntries={[path]}>
						<Routes>
							<Route
								path="/community/:communityId/member/:memberId/properties/*"
								element={<Story />}
							/>
							<Route
								path="/community/:communityId/admin/:memberId/properties/*"
								element={<RouteOutput />}
							/>
						</Routes>
					</MemoryRouter>
				</MockedProvider>
			</App>
		</ConfigProvider>
	);
};

const meta = {
	title: 'Components/Member/MemberPropertiesRouteGuard',
	component: MemberPropertiesRouteGuardContainer,
	args: { children: <div>Allowed member Property content</div> },
} satisfies Meta<typeof MemberPropertiesRouteGuardContainer>;

export default meta;
type Story = StoryObj<typeof MemberPropertiesRouteGuardContainer>;

export const Allowed: Story = {
	decorators: [decoratorFor()],
};

export const DeniedRole: Story = {
	decorators: [decoratorFor({ canEditOwnProperty: false })],
};

export const InactiveAccount: Story = {
	decorators: [decoratorFor({ accountStatus: 'CREATED' })],
};

export const RouteMismatch: Story = {
	decorators: [decoratorFor({ routeMemberId: '65f1f77bcf86cd7994390099' })],
};

/** The output route confirms manager traffic leaves the member subtree. */
export const ManagerRedirect: Story = {
	decorators: [decoratorFor({ canManageProperties: true })],
};
