import type { Meta, StoryObj } from '@storybook/react';
import { GraphQLError } from 'graphql';
import { Route, Routes } from 'react-router-dom';
import { LoggedInUserRootContainerCurrentEndUserAndCreateIfNotExistsDocument } from '../../../generated.tsx';
import { LoggedInUserContainer } from './index.tsx';

const meta = {
  title: 'UI/Organisms/Header/LoggedInUser/Container',
  component: LoggedInUserContainer,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof LoggedInUserContainer>;

export default meta;
type Story = StoryObj<typeof LoggedInUserContainer>;

// Root path variant (no communityId) — success
export const RootDefault: Story = {
  parameters: {
    memoryRouter: {
      initialEntries: ['/'],
    },
    apolloClient: {
      mocks: [
        {
          request: {
            query: LoggedInUserRootContainerCurrentEndUserAndCreateIfNotExistsDocument,
          },
          result: {
            data: {
              __typename: 'Query',
              currentEndUserAndCreateIfNotExists: {
                __typename: 'EndUser',
                externalId: null,
                id: 'user-1',
                personalInformation: {
                  __typename: 'EndUserPersonalInformation',
                  identityDetails: {
                    __typename: 'EndUserIdentityDetails',
                    restOfName: 'Jane',
                    lastName: 'Smith',
                  },
                },
              },
            },
          },
        },
      ],
    },
  },
  render: () => (
    <Routes>
      <Route path="/" element={<LoggedInUserContainer autoLogin={false} />} />
    </Routes>
  ),
};

// Root path variant — loading
export const RootLoading: Story = {
  parameters: {
    memoryRouter: {
      initialEntries: ['/'],
    },
    apolloClient: {
      mocks: [
        {
          request: {
            query: LoggedInUserRootContainerCurrentEndUserAndCreateIfNotExistsDocument,
          },
          delay: 2000,
          result: {
            data: {
              __typename: 'Query',
              currentEndUserAndCreateIfNotExists: {
                __typename: 'EndUser',
                externalId: null,
                id: 'user-1',
                personalInformation: {
                  __typename: 'EndUserPersonalInformation',
                  identityDetails: {
                    __typename: 'EndUserIdentityDetails',
                    restOfName: 'Loading',
                    lastName: 'User',
                  },
                },
              },
            },
          },
        },
      ],
    },
  },
  render: () => (
    <Routes>
      <Route path="/" element={<LoggedInUserContainer autoLogin={false} />} />
    </Routes>
  ),
};

// Root path variant — error
export const RootError: Story = {
  parameters: {
    memoryRouter: {
      initialEntries: ['/'],
    },
    apolloClient: {
      mocks: [
        {
          request: {
            query: LoggedInUserRootContainerCurrentEndUserAndCreateIfNotExistsDocument,
          },
          result: {
            errors: [new GraphQLError('Failed to fetch user')],
          },
        },
      ],
      // Force queries to bypass cache if a previous story populated it
      defaultOptions: {
        watchQuery: { fetchPolicy: 'network-only' },
        query: { fetchPolicy: 'network-only' },
      },
    },
  },
  render: () => (
    <Routes>
      <Route path="/" element={<LoggedInUserContainer key="root-error" autoLogin={false} />} />
    </Routes>
  ),
};

// Community path variant (with communityId) — the community container currently uses stubbed data
export const CommunityDefault: Story = {
  parameters: {
    memoryRouter: {
      initialEntries: ['/community/123'],
    },
  },
  render: () => (
    <Routes>
      <Route path="/community/:communityId" element={<LoggedInUserContainer autoLogin={false} />} />
    </Routes>
  ),
};
