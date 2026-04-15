import { MockedProvider } from '@apollo/client/testing';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import type { Decorator, Parameters, Preview } from '@storybook/react';
import 'antd/dist/reset.css';
import { AuthProvider } from 'react-oidc-context';

const mockOidcConfig = {
	authority: 'https://mock-authority.com',
	client_id: 'mock-client-id',
	redirect_uri: 'http://localhost:6006/auth-redirect',
	code_verifier: false,
	nonce: false,
	response_type: 'code',
	scope: 'openid profile',
	onSigninCallback: () => {},
};

export const decorators: Decorator[] = [
	(Story, context) => {
		const apolloParams = context.parameters?.apolloClient ?? {};
		const mocks = apolloParams.mocks ?? [];
		const { defaultOptions } = apolloParams;

		return (
			<HelmetProvider>
				<AuthProvider {...mockOidcConfig}>
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
};

const preview: Preview = {
	decorators,
	parameters,
};

export default preview;
