import type { Meta, StoryObj } from '@storybook/react';
import { GraphQLError } from 'graphql';
import { LoggedInUserRootContainer } from './logged-in-user-root.container.tsx';
import { LoggedInUserRootContainerCurrentEndUserAndCreateIfNotExistsDocument } from '../../../generated.tsx';

const meta = {
  title: 'UI/Organisms/Header/LoggedInUserRoot/Container',
  component: LoggedInUserRootContainer,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof LoggedInUserRootContainer>;

export default meta;
type Story = StoryObj<typeof LoggedInUserRootContainer>;

export const Default: Story = {
  parameters: {
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
  render: () => <LoggedInUserRootContainer autoLogin={false} />,
};

export const Loading: Story = {
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: LoggedInUserRootContainerCurrentEndUserAndCreateIfNotExistsDocument,
          },
          // Simulate loading by delaying the response noticeably
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
  render: () => <LoggedInUserRootContainer autoLogin={false} />,
};

export const ErrorState: Story = {
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: LoggedInUserRootContainerCurrentEndUserAndCreateIfNotExistsDocument,
          },
          result: {
            error: [new GraphQLError('Failed to fetch user')],
          },
        },
      ],
      // Force queries to hit mocks even if a previous story populated cache
      defaultOptions: {
        watchQuery: { fetchPolicy: 'network-only' },
        query: { fetchPolicy: 'network-only' },
      },
    },
  },
  render: () => <LoggedInUserRootContainer key="error" autoLogin={false} />,
};
