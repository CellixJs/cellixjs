// Global preview for Storybook in @apps/ui-staff
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
	redirect_uri: 'http://localhost:6009/auth-redirect',
	code_verifier: false,
	nonce: false,
	response_type: 'code',
	scope: 'openid profile',
	onSigninCallback: () => {
		console.log('Mock signin callback');
	},
};

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
							key={context.id}
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
	},

	options: {
		storySort: {
			order: ['Pages', 'Components'],
		},
	},

	a11y: {
		// 'todo' - show a11y violations in the test UI only
		// 'error' - fail CI on a11y violations
		// 'off' - skip a11y checks entirely
		test: 'todo',
	},
};
