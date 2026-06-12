import type { Preview, Decorator } from '@storybook/react';
import { MockedProvider } from '@apollo/client/testing';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { AuthProvider } from 'react-oidc-context';
import { apolloMocks } from '../../../../apps/ui-community/.storybook/apollo-mocks.ts';

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

const providersDecorator: Decorator = (Story) => (
	<HelmetProvider>
		<AuthProvider {...mockOidcConfig}>
			<MockedProvider mocks={apolloMocks} addTypename={true}>
				<Story />
			</MockedProvider>
		</AuthProvider>
	</HelmetProvider>
);

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/,
			},
		},

		a11y: {
			test: 'todo',
		},
	},
	decorators: [providersDecorator],
};

export default preview;
