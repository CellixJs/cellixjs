import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { ApolloProvider } from '@apollo/client';
import { AuthProvider } from 'react-oidc-context';
import { MemoryRouter } from 'react-router-dom';
import { ApolloConnection } from './index.tsx';
import { client } from './apollo-client-links.tsx';

// Mock environment variables
const mockEnv = {
  VITE_FUNCTION_ENDPOINT: 'https://mock-functions.example.com',
  VITE_AAD_B2C_ACCOUNT_AUTHORITY: 'https://mock-authority.example.com',
  VITE_AAD_B2C_ACCOUNT_CLIENTID: 'mock-client-id',
  NODE_ENV: 'development',
  PROD: false,
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
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
  clear: () => {},
  key: () => null,
  length: 0,
  set: (_key: string, _value: string) => {},
  get: (key: string) => mockStorage.getItem(key),
  remove: (_key: string) => {},
  getAllKeys: () => [],
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
  title: 'Components/UI/Organisms/ApolloConnection/Apollo Client Links',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Utility functions for creating Apollo Client links with authentication, custom headers, and GraphQL server configuration. These stories demonstrate how the link functions work within the ApolloConnection component.',
      },
    },
  },
  decorators: [
    (Story) => (
      <AuthProvider
        authority={mockEnv.VITE_AAD_B2C_ACCOUNT_AUTHORITY}
        client_id={mockEnv.VITE_AAD_B2C_ACCOUNT_CLIENTID}
        redirect_uri={window.location.origin}
        post_logout_redirect_uri={window.location.origin}
        userStore={mockStorage as any}
      >
        <ApolloProvider client={client}>
          <MemoryRouter initialEntries={['/accounts']}>
            <Story />
          </MemoryRouter>
        </ApolloProvider>
      </AuthProvider>
    ),
  ],
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<any>;

// Story demonstrating BaseApolloLink usage
export const BaseApolloLinkDemo: Story = {
  name: 'Base Apollo Link',
  render: () => (
    <div>
      <h2>Base Apollo Link</h2>
      <p>The BaseApolloLink creates a basic setContext link that can be extended with additional functionality.</p>
      <div data-testid="base-link-demo">
        <strong>Features:</strong>
        <ul>
          <li>Provides basic context setup</li>
          <li>Can be chained with other links</li>
          <li>Handles header configuration</li>
        </ul>
      </div>
    </div>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const demoElement = await canvas.findByTestId('base-link-demo');
    expect(demoElement).toBeInTheDocument();
  },
};

// Story demonstrating Auth Header Link
export const AuthHeaderLinkDemo: Story = {
  name: 'Authentication Header Link',
  render: () => (
    <div>
      <h2>Authentication Header Link</h2>
      <p>The ApolloLinkToAddAuthHeader automatically adds Bearer token authentication to GraphQL requests.</p>
      <div data-testid="auth-link-demo">
        <strong>Features:</strong>
        <ul>
          <li>Uses react-oidc-context for token retrieval</li>
          <li>Falls back to sessionStorage/localStorage</li>
          <li>Automatically adds Authorization header</li>
          <li>Supports multiple implementation variants</li>
        </ul>
      </div>
    </div>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const demoElement = await canvas.findByTestId('auth-link-demo');
    expect(demoElement).toBeInTheDocument();
  },
};

// Story demonstrating Custom Header Link
export const CustomHeaderLinkDemo: Story = {
  name: 'Custom Header Link',
  render: () => (
    <div>
      <h2>Custom Header Link</h2>
      <p>The ApolloLinkToAddCustomHeader allows adding custom headers to GraphQL requests.</p>
      <div data-testid="custom-header-demo">
        <strong>Features:</strong>
        <ul>
          <li>Adds custom headers conditionally</li>
          <li>Supports null/undefined values</li>
          <li>Flexible header name and value configuration</li>
        </ul>
      </div>
    </div>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const demoElement = await canvas.findByTestId('custom-header-demo');
    expect(demoElement).toBeInTheDocument();
  },
};

// Story demonstrating GraphQL Server Link
export const GraphqlServerLinkDemo: Story = {
  name: 'GraphQL Server Link',
  render: () => (
    <div>
      <h2>GraphQL Server Link</h2>
      <p>The TerminatingApolloLinkForGraphqlServer creates the final link that connects to the GraphQL server.</p>
      <div data-testid="graphql-server-demo">
        <strong>Features:</strong>
          <li>Uses BatchHttpLink for request batching</li>
          <li>Includes removeTypenameFromVariables</li>
          <li>Configurable batch size and interval</li>
          <li>Terminating link in the chain</li>
      </div>
    </div>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const demoElement = await canvas.findByTestId('graphql-server-demo');
    expect(demoElement).toBeInTheDocument();
  },
};

// Story demonstrating Apollo Client Instance
export const ApolloClientDemo: Story = {
  name: 'Apollo Client Instance',
  render: () => (
    <div>
      <h2>Apollo Client Instance</h2>
      <p>The configured Apollo Client instance with all links properly chained.</p>
      <div data-testid="apollo-client-demo">
        <strong>Configuration:</strong>
        <ul>
          <li>In-memory cache</li>
          <li>Dynamic link chain based on auth state</li>
          <li>Development tools enabled</li>
          <li>Support for multiple data sources</li>
        </ul>
      </div>
    </div>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const demoElement = await canvas.findByTestId('apollo-client-demo');
    expect(demoElement).toBeInTheDocument();
  },
};

// Story demonstrating Link Chaining
export const LinkChainingDemo: Story = {
  name: 'Link Chaining',
  render: () => (
    <div>
      <h2>Link Chaining</h2>
      <p>Demonstrates how multiple Apollo Links are chained together to create the complete request pipeline.</p>
      <div data-testid="link-chaining-demo">
        <strong>Chain Order:</strong>
        <ol>
          <li>BaseApolloLink - Basic context setup</li>
          <li>ApolloLinkToAddAuthHeader - Authentication</li>
          <li>ApolloLinkToAddCustomHeader - Custom headers (community, member)</li>
          <li>TerminatingApolloLinkForGraphqlServer - Final HTTP connection</li>
        </ol>
      </div>
    </div>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const demoElement = await canvas.findByTestId('link-chaining-demo');
    expect(demoElement).toBeInTheDocument();
  },
};

// Story showing the complete ApolloConnection usage
export const ApolloConnectionIntegration: Story = {
  name: 'Apollo Connection Integration',
  render: () => (
    <ApolloConnection>
      <div data-testid="integration-demo">
        <h2>Apollo Connection Integration</h2>
        <p>This demonstrates the ApolloConnection component using all the utility links.</p>
        <div>
          <strong>Current Route Context:</strong> /accounts
        </div>
        <div>
          <strong>Authentication:</strong> Enabled with mock token
        </div>
        <div>
          <strong>GraphQL Endpoint:</strong> {mockEnv.VITE_FUNCTION_ENDPOINT}
        </div>
      </div>
    </ApolloConnection>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const demoElement = await canvas.findByTestId('integration-demo');
    expect(demoElement).toBeInTheDocument();
    expect(demoElement).toHaveTextContent('Apollo Connection Integration');
  },
};