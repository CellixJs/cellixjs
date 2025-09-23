import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { CommunityList } from './community-list.tsx';
import { MemoryRouter } from 'react-router-dom';

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
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the title is present
    const title = await canvas.findByRole('heading', { name: /navigate to a community/i });
    expect(title).toBeInTheDocument();

    // Verify the create community button is present
    const createButton = await canvas.findByRole('button', { name: /create a community/i });
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
    const memberPortalButton = await canvas.findByRole('button', { name: /member portals/i });
    expect(memberPortalButton).toBeInTheDocument();

    // Verify admin portal dropdown is present
    const adminPortalButton = await canvas.findByRole('button', { name: /admin portals/i });
    expect(adminPortalButton).toBeInTheDocument();
  },
};