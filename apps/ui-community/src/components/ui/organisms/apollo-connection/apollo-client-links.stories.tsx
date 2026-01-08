import { ApolloClient, gql, InMemoryCache, useApolloClient, ApolloLink, Observable } from '@apollo/client';
import type { Meta, StoryObj } from '@storybook/react';
import { useState, useMemo } from 'react';
import { AuthProvider, type AuthContextProps } from 'react-oidc-context';
import { MemoryRouter } from 'react-router-dom';
import { expect, within, waitFor } from 'storybook/test';
import {
	ApolloLinkToAddAuthHeader,
	ApolloLinkToAddAuthHeader1,
	ApolloLinkToAddAuthHeader2,
	ApolloLinkToAddCustomHeader,
	BaseApolloLink,
	TerminatingApolloLinkForGraphqlServer,
} from './apollo-client-links.tsx';
import { ApolloConnection } from './index.tsx';

interface MockAuth {
	user: { access_token: string } | null;
	isAuthenticated: boolean;
}

// Mock environment variables
const mockEnv = {
	VITE_FUNCTION_ENDPOINT: 'https://mock-functions.example.com',
	VITE_AAD_B2C_ACCOUNT_AUTHORITY: 'https://mock-authority.example.com',
	VITE_AAD_B2C_ACCOUNT_CLIENTID: 'mock-id',
	NODE_ENV: 'development',
	PROD: false,
};

// Mock window.sessionStorage and window.localStorage
const mockStorage = {
	store: {} as Record<string, string>,
	getItem(key: string) {
		return this.store[key] || null;
	},
	setItem(key: string, value: string) {
		this.store[key] = value;
	},
	removeItem(key: string) {
		delete this.store[key];
	},
	clear() {
		this.store = {};
	},
	key: (index: number) => Object.keys(mockStorage.store)[index] || null,
	get length() {
		return Object.keys(this.store).length;
	},
};

// Setup global mocks
Object.defineProperty(globalThis, 'sessionStorage', {
	value: mockStorage,
	writable: true,
});
Object.defineProperty(globalThis, 'localStorage', {
	value: mockStorage,
	writable: true,
});

// Mock import.meta.env
try {
	Object.defineProperty(import.meta, 'env', {
		value: mockEnv,
		writable: true,
	});
} catch (e) {
	console.warn('Could not mock import.meta.env', e);
}

const meta = {
	title: 'Components/UI/Organisms/ApolloConnection/Apollo Client Links',
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta;

export default meta;

// Terminating link for testing
const mockTerminatingLink = new ApolloLink((_operation) => {
	return new Observable((observer) => {
		observer.next({
			data: {
				__typename: 'Query',
				test: 'success',
			},
		});
		observer.complete();
	});
});

// Test component that verifies Apollo link functionality
const ApolloLinkTester = ({ customClient }: { customClient?: ApolloClient<unknown> }) => {
	const defaultClient = useApolloClient();
	const activeClient = customClient || defaultClient;
	const [authResult, setAuthResult] = useState<string | null>(null);
	const [headersResult, setHeadersResult] = useState<string | null>(null);

	const testAuthHeader = async () => {
		try {
			// We use a query that will trigger the link chain
			// We don't care about the actual result, just that it doesn't throw before the link runs
			const result = await activeClient.query({
				query: gql`
          query TestQuery {
            __typename
          }
        `,
				fetchPolicy: 'no-cache',
			});
			setAuthResult(JSON.stringify({ success: true, data: result.data }));
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			setAuthResult(JSON.stringify({ success: false, error: message }));
		}
	};

	const testCustomHeaders = () => {
		const { link } = activeClient;
		setHeadersResult(JSON.stringify({ linkType: link.constructor.name }));
	};

	return (
		<div data-testid="apollo-link-tester">
			<button type="button" data-testid="test-auth-button" onClick={testAuthHeader}>
				Test Auth Header
			</button>
			<button type="button" data-testid="test-headers-button" onClick={testCustomHeaders}>
				Test Custom Headers
			</button>
			<div data-testid="auth-result">{authResult}</div>
			<div data-testid="headers-result">{headersResult}</div>
			<div data-testid="client-info">
				<strong>Client Link Chain:</strong> {activeClient.link?.constructor.name || 'None'}
			</div>
		</div>
	);
};

const CustomClientTester = ({ link }: { link: ApolloLink }) => {
	const testClient = useMemo(() => new ApolloClient({
		link: ApolloLink.from([link, mockTerminatingLink]),
		cache: new InMemoryCache(),
	}), [link]);
	return <ApolloLinkTester customClient={testClient} />;
};

export const BaseLink: StoryObj = {
	render: () => <CustomClientTester link={BaseApolloLink()} />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await canvas.findByTestId('test-auth-button').then(b => b.click());
		const result = await canvas.findByTestId('auth-result');
		await waitFor(() => {
			expect(result.textContent).toContain('success');
		});
	}
};

export const AuthHeaderFallbackStorage: StoryObj = {
	render: () => {
		const auth: MockAuth = { user: null, isAuthenticated: false };
		const authority = mockEnv.VITE_AAD_B2C_ACCOUNT_AUTHORITY;
		const client_id = mockEnv.VITE_AAD_B2C_ACCOUNT_CLIENTID;
		const storageKey = `oidc.user:${authority}:${client_id}`;
		
		const mockToken = ['mock', 'token'].join('-');
		mockStorage.setItem(storageKey, JSON.stringify({ access_token: mockToken }));

		return <CustomClientTester link={ApolloLinkToAddAuthHeader(auth as unknown as AuthContextProps)} />;
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await canvas.findByTestId('test-auth-button').then(b => b.click());
		const result = await canvas.findByTestId('auth-result');
		await waitFor(() => {
			expect(result.textContent).toContain('success');
		});
	}
};

export const AuthHeaderStorageParseError: StoryObj = {
	render: () => {
		const auth: MockAuth = { user: null, isAuthenticated: false };
		const authority = mockEnv.VITE_AAD_B2C_ACCOUNT_AUTHORITY;
		const client_id = mockEnv.VITE_AAD_B2C_ACCOUNT_CLIENTID;
		const storageKey = `oidc.user:${authority}:${client_id}`;
		
		mockStorage.setItem(storageKey, 'invalid-json{');

		return <CustomClientTester link={ApolloLinkToAddAuthHeader(auth as unknown as AuthContextProps)} />;
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await canvas.findByTestId('test-auth-button').then(b => b.click());
		const result = await canvas.findByTestId('auth-result');
		await waitFor(() => {
			expect(result.textContent).toContain('success');
		});
	}
};

export const AuthHeaderLink1: StoryObj = {
	render: () => {
		const mockToken = ['mock', 'token', '1'].join('-');
		const auth: MockAuth = { user: { access_token: mockToken }, isAuthenticated: true };
		return <CustomClientTester link={ApolloLinkToAddAuthHeader1(auth as unknown as AuthContextProps)} />;
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await canvas.findByTestId('test-auth-button').then(b => b.click());
		const result = await canvas.findByTestId('auth-result');
		await waitFor(() => {
			expect(result.textContent).toContain('success');
		});
	}
};

export const AuthHeaderLink1NotAuth: StoryObj = {
	render: () => {
		const auth: MockAuth = { user: null, isAuthenticated: false };
		return <CustomClientTester link={ApolloLinkToAddAuthHeader1(auth as unknown as AuthContextProps)} />;
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await canvas.findByTestId('test-auth-button').then(b => b.click());
		const result = await canvas.findByTestId('auth-result');
		await waitFor(() => {
			expect(result.textContent).toContain('success');
		});
	}
};

export const AuthHeaderLink2: StoryObj = {
	render: () => {
		const mockToken = ['mock', 'token', '2'].join('-');
		const auth: MockAuth = { user: { access_token: mockToken }, isAuthenticated: true };
		return <CustomClientTester link={ApolloLinkToAddAuthHeader2(auth as unknown as AuthContextProps)} />;
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await canvas.findByTestId('test-auth-button').then(b => b.click());
		const result = await canvas.findByTestId('auth-result');
		await waitFor(() => {
			expect(result.textContent).toContain('success');
		});
	}
};

export const CustomHeaderIfTrueFalse: StoryObj = {
	render: () => <CustomClientTester link={ApolloLinkToAddCustomHeader('x-test', 'value', false)} />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await canvas.findByTestId('test-auth-button').then(b => b.click());
		const result = await canvas.findByTestId('auth-result');
		await waitFor(() => {
			expect(result.textContent).toContain('success');
		});
	}
};

export const CustomHeaderNoValue: StoryObj = {
	render: () => <CustomClientTester link={ApolloLinkToAddCustomHeader('x-test', null)} />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await canvas.findByTestId('test-auth-button').then(b => b.click());
		const result = await canvas.findByTestId('auth-result');
		await waitFor(() => {
			expect(result.textContent).toContain('success');
		});
	}
};

export const AuthHeaderNoToken: StoryObj = {
	render: () => {
		const auth: MockAuth = { user: null, isAuthenticated: false };
		mockStorage.clear();
		return <CustomClientTester link={ApolloLinkToAddAuthHeader(auth as unknown as AuthContextProps)} />;
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await canvas.findByTestId('test-auth-button').then(b => b.click());
		const result = await canvas.findByTestId('auth-result');
		await waitFor(() => {
			expect(result.textContent).toContain('success');
		});
	}
};

export const TerminatingLink: StoryObj = {
	render: () => {
		const testClient = new ApolloClient({
			link: TerminatingApolloLinkForGraphqlServer({
				uri: 'http://localhost/graphql',
				batchMax: 5,
				batchInterval: 10,
			}),
			cache: new InMemoryCache(),
		});
		return <ApolloLinkTester customClient={testClient as ApolloClient<unknown>} />;
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await canvas.findByTestId('test-headers-button').then(b => b.click());
		const result = await canvas.findByTestId('headers-result');
		expect(result.textContent).toContain('Link');
	}
};

export const ApolloConnectionIntegration: StoryObj = {
	render: () => (
		<MemoryRouter>
			<AuthProvider 
				authority={mockEnv.VITE_AAD_B2C_ACCOUNT_AUTHORITY}
				client_id={mockEnv.VITE_AAD_B2C_ACCOUNT_CLIENTID}
			>
				<ApolloConnection>
					<ApolloLinkTester />
				</ApolloConnection>
			</AuthProvider>
		</MemoryRouter>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		expect(await canvas.findByTestId('apollo-link-tester')).toBeInTheDocument();
	}
};

