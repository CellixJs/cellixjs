import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from 'react-oidc-context';
import { ApolloProvider } from '@apollo/client';
import { ApolloConnection } from './index.tsx';
import { client } from './apollo-client-links.tsx';

// Mock environment variables
const mockEnv = {
  VITE_FUNCTION_ENDPOINT: 'https://mock-functions.example.com',
  VITE_AAD_B2C_ACCOUNT_AUTHORITY: 'https://mock-authority.example.com',
  VITE_AAD_B2C_ACCOUNT_CLIENTID: 'mock-client-id',
  NODE_ENV: 'development',
};

// Mock window.sessionStorage and window.localStorage
const mockStorage = {
  getItem: (key: string) => {
    if (key.includes('oidc.user')) {
      return JSON.stringify({
        access_token: 'fallback-access-token',
        profile: { sub: 'fallback-user' },
      });
    }
    return null;
  },
  setItem: (_key: string, _value: string) => Promise.resolve(),
  removeItem: (_key: string) => Promise.resolve(),
  clear: () => Promise.resolve(),
  key: () => null,
  length: 0,
  set: (_key: string, _value: string) => Promise.resolve(),
  get: (key: string) => Promise.resolve(mockStorage.getItem(key)),
  remove: (key: string) => Promise.resolve(key),
  getAllKeys: () => Promise.resolve([]),
};

// Setup global mocks
Object.defineProperty(window, 'sessionStorage', { value: mockStorage, writable: true });
Object.defineProperty(window, 'localStorage', { value: mockStorage, writable: true });

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: mockEnv,
  writable: true,
});

const meta = {
  title: 'Components/UI/Organisms/ApolloConnection',
  component: ApolloConnection,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <AuthProvider
        authority={mockEnv.VITE_AAD_B2C_ACCOUNT_AUTHORITY}
        client_id={mockEnv.VITE_AAD_B2C_ACCOUNT_CLIENTID}
        redirect_uri={window.location.origin}
        post_logout_redirect_uri={window.location.origin}
        userStore={mockStorage}
      >
        <ApolloProvider client={client}>
          <Story />
        </ApolloProvider>
      </AuthProvider>
    ),
  ],
  argTypes: {
    children: {
      control: { type: 'text' },
      description: 'Child components to be wrapped by ApolloConnection',
    },
  },
} satisfies Meta<typeof ApolloConnection>;

export default meta;
type Story = StoryObj<typeof ApolloConnection>;

export const Default: Story = {
  args: {
    children: <div data-testid="test-child">Test Child Component</div>,
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/accounts']}>
        <Story />
      </MemoryRouter>
    ),
  ],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    // Verify that the component renders without errors
    expect(canvasElement).toBeTruthy();

    // Verify that the child component is rendered
    const childElement = await canvas.findByTestId('test-child');
    expect(childElement).toBeInTheDocument();
    expect(childElement).toHaveTextContent('Test Child Component');
  },
};

export const WithCommunityRoute: Story = {
  args: {
    children: <div data-testid="community-child">Community Page Content</div>,
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/community123/member456/page']}>
        <Story />
      </MemoryRouter>
    ),
  ],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    // Verify that the component renders with community context
    expect(canvasElement).toBeTruthy();

    // Verify that the child component is rendered
    const childElement = await canvas.findByTestId('community-child');
    expect(childElement).toBeInTheDocument();
    expect(childElement).toHaveTextContent('Community Page Content');
  },
};

export const WithAccountsRoute: Story = {
  args: {
    children: <div data-testid="accounts-child">Accounts Page Content</div>,
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/accounts']}>
        <Story />
      </MemoryRouter>
    ),
  ],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    // Verify that the component renders with accounts context
    expect(canvasElement).toBeTruthy();

    // Verify that the child component is rendered
    const childElement = await canvas.findByTestId('accounts-child');
    expect(childElement).toBeInTheDocument();
    expect(childElement).toHaveTextContent('Accounts Page Content');
  },
};

export const Unauthenticated: Story = {
  args: {
    children: <div data-testid="unauth-child">Unauthenticated Content</div>,
  },
  decorators: [
    (Story) => (
      <AuthProvider
        authority={mockEnv.VITE_AAD_B2C_ACCOUNT_AUTHORITY}
        client_id={mockEnv.VITE_AAD_B2C_ACCOUNT_CLIENTID}
        redirect_uri={window.location.origin}
        post_logout_redirect_uri={window.location.origin}
        userStore={mockStorage}
        onSigninCallback={() => {
          // Mock unauthenticated state
          return Promise.resolve();
        }}
      >
        <ApolloProvider client={client}>
          <MemoryRouter initialEntries={['/accounts']}>
            <Story />
          </MemoryRouter>
        </ApolloProvider>
      </AuthProvider>
    ),
  ],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    // Verify that the component renders even when unauthenticated
    expect(canvasElement).toBeTruthy();

    // Verify that the child component is rendered
    const childElement = await canvas.findByTestId('unauth-child');
    expect(childElement).toBeInTheDocument();
    expect(childElement).toHaveTextContent('Unauthenticated Content');
  },
};

export const WithAdminRoute: Story = {
  args: {
    children: <div data-testid="admin-child">Admin Page Content</div>,
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/community123/admin/abc123/settings']}>
        <Story />
      </MemoryRouter>
    ),
  ],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    // Verify that the component renders with admin context
    expect(canvasElement).toBeTruthy();

    // Verify that the child component is rendered
    const childElement = await canvas.findByTestId('admin-child');
    expect(childElement).toBeInTheDocument();
    expect(childElement).toHaveTextContent('Admin Page Content');
  },
};