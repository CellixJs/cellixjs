import { MockedProvider } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, within } from 'storybook/test';
import { AdminSectionLayoutContainerMembersForCurrentEndUserDocument } from '../generated.tsx';
import { PropertiesRouteGuardContainer } from './properties-route-guard.container.tsx';

const communityId = '65f1f77bcf86cd7994390001';
const memberId = '65f1f77bcf86cd7994390002';
const currentEndUserId = '65f1f77bcf86cd7994390009';

const buildMembersMock = (canManageProperties: boolean, accountStatusCode: string = 'ACCEPTED') => ({
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
							statusCode: accountStatusCode,
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

const routerDecorator = (mocks: Parameters<typeof MockedProvider>[0]['mocks'], routeCommunityId: string = communityId) => {
	const Decorator = (Story: React.ComponentType) => (
		<MockedProvider mocks={mocks}>
			<MemoryRouter initialEntries={[`/community/${routeCommunityId}/admin/${memberId}/properties`]}>
				<Routes>
					<Route
						path="/community/:communityId/admin/:memberId/properties/*"
						element={<Story />}
					/>
				</Routes>
			</MemoryRouter>
		</MockedProvider>
	);
	return Decorator;
};

const meta = {
	title: 'Components/Layouts/Admin/PropertiesRouteGuardContainer',
	component: PropertiesRouteGuardContainer,
	parameters: {
		layout: 'padded',
	},
	args: {
		children: <div>Protected Properties Content</div>,
	},
} satisfies Meta<typeof PropertiesRouteGuardContainer>;

export default meta;
type Story = StoryObj<typeof PropertiesRouteGuardContainer>;

export const Authorized: Story = {
	decorators: [routerDecorator([buildMembersMock(true)])],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// A member whose role grants canManageProperties sees the section content
		expect(await canvas.findByText('Protected Properties Content')).toBeInTheDocument();
	},
};

export const PermissionDenied: Story = {
	decorators: [routerDecorator([buildMembersMock(false)])],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// A member without canManageProperties gets a 403 result instead
		expect(await canvas.findByText('403')).toBeInTheDocument();
		expect(canvas.getByText('Sorry, you are not authorized to manage properties for this community.')).toBeInTheDocument();
		expect(canvas.queryByText('Protected Properties Content')).not.toBeInTheDocument();
	},
};

export const OtherCommunityRouteDenied: Story = {
	decorators: [routerDecorator([buildMembersMock(true)], '65f1f77bcf86cd7994390077')],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// A member id from one community must not unlock another community's
		// route: both the member and community route params have to match.
		expect(await canvas.findByText('403')).toBeInTheDocument();
		expect(canvas.queryByText('Protected Properties Content')).not.toBeInTheDocument();
	},
};

export const DeactivatedMemberDenied: Story = {
	decorators: [routerDecorator([buildMembersMock(true, 'REJECTED')])],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// A manager whose account is no longer ACCEPTED must be denied,
		// mirroring the backend's active-account requirement.
		expect(await canvas.findByText('403')).toBeInTheDocument();
		expect(canvas.queryByText('Protected Properties Content')).not.toBeInTheDocument();
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

		expect(canvas.queryByText('Protected Properties Content')).not.toBeInTheDocument();
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
