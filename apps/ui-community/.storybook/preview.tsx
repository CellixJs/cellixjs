// Global preview for Storybook in @ocom/ui-community
// Import Ant Design base styles so components render correctly
import { MockedProvider } from '@apollo/client/testing';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import type { Decorator, Parameters } from '@storybook/react';
import 'antd/dist/reset.css';
import { AuthProvider } from 'react-oidc-context';
import { ThemeProvider } from '../src/contexts/theme-context.tsx';
import { apolloMocks } from './apollo-mocks.ts';

// Mock OIDC configuration for stories
const mockOidcConfig = {
  authority: 'https://mock-authority.com',
  client_id: 'mock-client-id',
  redirect_uri: 'http://localhost:6006/auth-redirect',
  code_verifier: false,
  nonce: false,
  response_type: 'code',
  scope: 'openid profile',
  onSigninCallback: () => {
    console.log('Mock signin callback');
  }
};

// Global decorators - removed MemoryRouter to avoid conflicts with components that use routing
export const decorators: Decorator[] = [
  (Story, context) => {
    const apolloParams = context.parameters?.apolloClient ?? {};
    const mocks = apolloParams.mocks ?? apolloMocks;
    const { defaultOptions } = apolloParams;

    return (
      <HelmetProvider>
        <AuthProvider {...mockOidcConfig}>
          <ThemeProvider>
            <MockedProvider
              key={context.id} // Ensure fresh instance per story
              mocks={mocks}
              defaultOptions={{
                ...defaultOptions,
                watchQuery: { fetchPolicy: 'network-only' },
                query: { fetchPolicy: 'network-only' },
              }}
            >
              <Story />
            </MockedProvider>
          </ThemeProvider>
        </AuthProvider>
      </HelmetProvider>
    );
  },
];

// Global parameters
export const parameters: Parameters = {
	layout: 'padded',
	actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    apolloClient: {
        MockedProvider,
    }
};