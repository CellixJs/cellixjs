import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, within } from 'storybook/test';
import { AdminSectionLayoutContainerMembersForCurrentEndUserDocument } from '../generated.tsx';
import { NonPropertyAdminRouteGuardContainer } from './non-property-admin-route-guard.container.tsx';

const communityId = '65f1f77bcf86cd7994390001';
const memberId = '65f1f77bcf86cd7994390002';
const currentEndUserId = '65f1f77bcf86cd7994390009';

const buildMembersMock = (isNonPropertyAdmin: boolean, canManageProperties: boolean = true) => ({
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
							isNonPropertyAdmin,
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

const routerDecorator = (mocks: Parameters<typeof MockedProvider>[0]['mocks'], routeCommunityId: string = communityId) => {
	const Decorator = (Story: React.ComponentType) => (
		<MockedProvider mocks={mocks}>
			<MemoryRouter initialEntries={[`/community/${routeCommunityId}/admin/${memberId}/members`]}>
				<Routes>
					<Route
						path="/community/:communityId/admin/:memberId/members/*"
						element={<Story />}
					/>
				</Routes>
			</MemoryRouter>
		</MockedProvider>
	);
	return Decorator;
};

const meta = {
	title: 'Components/Layouts/Admin/NonPropertyAdminRouteGuardContainer',
	component: NonPropertyAdminRouteGuardContainer,
	parameters: {
		layout: 'padded',
	},
	args: {
		children: <div>Protected Members Content</div>,
	},
} satisfies Meta<typeof NonPropertyAdminRouteGuardContainer>;

export default meta;
type Story = StoryObj<typeof NonPropertyAdminRouteGuardContainer>;

export const Authorized: Story = {
	decorators: [routerDecorator([buildMembersMock(true)])],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// A member whose role grants non-property admin permissions sees the section content
		expect(await canvas.findByText('Protected Members Content')).toBeInTheDocument();
	},
};

export const PropertyOnlyManagerDenied: Story = {
	decorators: [routerDecorator([buildMembersMock(false, true)])],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// A property-only manager deep linking to the Members URL gets a 403
		// result rather than the member-management screens.
		expect(await canvas.findByText('403')).toBeInTheDocument();
		expect(canvas.getByText('Sorry, you are not authorized to administer this community.')).toBeInTheDocument();
		expect(canvas.queryByText('Protected Members Content')).not.toBeInTheDocument();
	},
};

export const OtherCommunityRouteDenied: Story = {
	decorators: [routerDecorator([buildMembersMock(true)], '65f1f77bcf86cd7994390077')],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// A member id from one community must not unlock another community's
		// route: both the member and community route params have to match.
		expect(await canvas.findByText('403')).toBeInTheDocument();
		expect(canvas.queryByText('Protected Members Content')).not.toBeInTheDocument();
	},
};

export const Loading: Story = {
	decorators: [
		routerDecorator([
			{
				...buildMembersMock(true),
				delay: 1_000_000,
			},
		]),
	],
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		expect(canvas.queryByText('Protected Members Content')).not.toBeInTheDocument();
	},
};

export const ErrorState: Story = {
	decorators: [
		routerDecorator([
			{
				request: {
					query: AdminSectionLayoutContainerMembersForCurrentEndUserDocument,
				},
				error: new Error('Failed to load current member'),
			},
		]),
	],
	play: async ({ canvasElement }) => {
		const body = within(canvasElement.ownerDocument.body);

		expect(await body.findByText(/Failed to load current member/i)).toBeInTheDocument();
	},
};
