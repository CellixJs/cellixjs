import { MockedProvider } from '@apollo/client/testing';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import type { Decorator, Parameters } from '@storybook/react';
import { App as AntdApp } from 'antd';
import 'antd/dist/reset.css';
import { AuthProvider } from 'react-oidc-context';
import { LoggedInUserRootContainerCurrentEndUserAndCreateIfNotExistsDocument } from '../../ui-shared/src/generated.tsx';

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

const defaultMocks = [
	{
		request: {
			query: LoggedInUserRootContainerCurrentEndUserAndCreateIfNotExistsDocument,
			variables: {},
		},
		result: {
			data: {
				currentEndUserAndCreateIfNotExists: {
					__typename: 'EndUser',
					id: 'enduser-1',
					externalId: 'user-123',
					personalInformation: {
						__typename: 'EndUserPersonalInformation',
						identityDetails: {
							__typename: 'EndUserIdentityDetails',
							lastName: 'Doe',
							restOfName: 'John',
						},
					},
				},
			},
		},
	},
];

export const decorators: Decorator[] = [
	(Story, context) => {
		const apolloParams = context.parameters?.apolloClient ?? {};
		const mocks = apolloParams.mocks ?? defaultMocks;
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
						<AntdApp>
							<Story />
						</AntdApp>
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
	a11y: {
		test: 'todo',
	},
};
