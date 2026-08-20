import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { expect, userEvent, within } from 'storybook/test';
import { CommunityList, type CommunityListProps } from './community-list.tsx';

const meta = {
	title: 'Components/Accounts/CommunityList',
	component: CommunityList,
	parameters: {
		layout: 'padded',
	},
	decorators: [
		(Story) => (
			<MemoryRouter>
				<Story />
			</MemoryRouter>
		),
	],
} satisfies Meta<typeof CommunityList>;

export default meta;
type Story = StoryObj<typeof CommunityList>;

const mockData = {
	communities: [
		{
			id: 'community-1',
			name: 'Test Community 1',
			domain: null,
			whiteLabelDomain: null,
			handle: null,
			publicContentBlobUrl: null,
			schemaVersion: '1.0',
			createdAt: new Date('2024-01-01'),
			updatedAt: new Date('2024-01-01'),
			__typename: 'Community' as const,
		},
		{
			id: 'community-2',
			name: 'Test Community 2',
			domain: null,
			whiteLabelDomain: null,
			handle: null,
			publicContentBlobUrl: null,
			schemaVersion: '1.0',
			createdAt: new Date('2024-01-01'),
			updatedAt: new Date('2024-01-01'),
			__typename: 'Community' as const,
		},
	],
	members: [
		[
			{
				id: 'member-1',
				memberName: 'John Doe',
				isAdmin: true,
				community: { id: 'community-1', __typename: 'Community' as const },
				__typename: 'Member' as const,
			},
			{
				id: 'member-2',
				memberName: 'Jane Smith',
				isAdmin: false,
				community: { id: 'community-1', __typename: 'Community' as const },
				__typename: 'Member' as const,
			},
		],
		[
			{
				id: 'member-3',
				memberName: 'Bob Johnson',
				isAdmin: true,
				community: { id: 'community-2', __typename: 'Community' as const },
				__typename: 'Member' as const,
			},
		],
	],
};

export const Default: Story = {
	args: {
		data: mockData,
		canCreateCommunity: true,
	} satisfies CommunityListProps,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify the title is present
		const title = await canvas.findByRole('heading', {
			name: /navigate to a community/i,
		});
		expect(title).toBeInTheDocument();

		// Verify the create community button is present
		const createButton = await canvas.findByRole('button', {
			name: /create a community/i,
		});
		expect(createButton).toBeInTheDocument();

		// Verify the search input is present
		const searchInput = canvas.getByPlaceholderText('Search for a community');
		expect(searchInput).toBeInTheDocument();

		// Verify community names are displayed in the table
		const community1 = await canvas.findByText('Test Community 1');
		const community2 = await canvas.findByText('Test Community 2');
		expect(community1).toBeInTheDocument();
		expect(community2).toBeInTheDocument();
	},
};

export const SearchFunctionality: Story = {
	args: {
		data: mockData,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Test search functionality
		const searchInput = canvas.getByPlaceholderText('Search for a community');
		await userEvent.type(searchInput, 'Community 1');

		// Verify only the matching community is shown
		const community1 = await canvas.findByText('Test Community 1');
		expect(community1).toBeInTheDocument();

		// Verify the other community is not shown
		expect(canvas.queryByText('Test Community 2')).not.toBeInTheDocument();
	},
};

export const EmptyState: Story = {
	args: {
		data: {
			communities: [],
			members: [],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify the empty state message is shown
		const emptyMessage = await canvas.findByText('No communities found.');
		expect(emptyMessage).toBeInTheDocument();
	},
};

export const SingleCommunity: Story = {
	args: {
		data: {
			communities: [
				{
					id: 'community-1',
					name: 'Single Community',
					domain: null,
					whiteLabelDomain: null,
					handle: null,
					publicContentBlobUrl: null,
					schemaVersion: '1.0',
					createdAt: new Date('2024-01-01'),
					updatedAt: new Date('2024-01-01'),
					__typename: 'Community' as const,
				},
			],
			members: [
				[
					{
						id: 'member-1',
						memberName: 'Admin User',
						isAdmin: true,
						community: { id: 'community-1', __typename: 'Community' as const },
						__typename: 'Member' as const,
					},
				],
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify the single community is displayed
		const community = await canvas.findByText('Single Community');
		expect(community).toBeInTheDocument();

		// Verify member portal dropdown is present
		const memberPortalButton = await canvas.findByRole('button', {
			name: /member portals/i,
		});
		expect(memberPortalButton).toBeInTheDocument();

		// Verify admin portal dropdown is present
		const adminPortalButton = await canvas.findByRole('button', {
			name: /admin portals/i,
		});
		expect(adminPortalButton).toBeInTheDocument();
	},
};

export const PropertyManagerListedInAdminPortals: Story = {
	args: {
		data: {
			communities: [mockData.communities[0]],
			currentEndUserId: 'enduser-1',
			members: [
				[
					{
						id: 'member-manager',
						memberName: 'Pat Manager',
						isAdmin: false,
						accounts: [
							{
								statusCode: 'ACCEPTED',
								user: { id: 'enduser-1', __typename: 'EndUser' as const },
								__typename: 'MemberAccount' as const,
							},
						],
						role: {
							id: 'role-1',
							permissions: {
								propertyPermissions: {
									canManageProperties: true,
									__typename: 'PropertyPermissions' as const,
								},
								__typename: 'EndUserRolePermissions' as const,
							},
							__typename: 'EndUserRole' as const,
						},
						community: { id: 'community-1', __typename: 'Community' as const },
						__typename: 'Member' as const,
					},
					{
						id: 'member-plain',
						memberName: 'Regular Renter',
						isAdmin: false,
						accounts: [],
						role: null,
						community: { id: 'community-1', __typename: 'Community' as const },
						__typename: 'Member' as const,
					},
				],
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);

		const adminPortalButton = await canvas.findByRole('button', {
			name: /admin portals/i,
		});
		await userEvent.hover(adminPortalButton);

		// A non-admin property manager with an accepted account is offered the admin portal
		await expect(await body.findByRole('button', { name: 'Pat Manager' })).toBeInTheDocument();
		// A member without admin or property management stays out of the admin column
		expect(body.queryByRole('button', { name: 'Regular Renter' })).not.toBeInTheDocument();
	},
};
