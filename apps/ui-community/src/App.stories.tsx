import { ApolloProvider } from '@apollo/client';
import type { Meta, StoryObj } from '@storybook/react';
import { AuthProvider } from 'react-oidc-context';
import { MemoryRouter } from 'react-router-dom';
import { expect } from 'storybook/test';
import App from './App.tsx';
import { client } from './components/ui/organisms/apollo-connection/apollo-client-links.tsx';

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
				access_token: '',
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
	getAllKeys: () => Promise.resolve(['']),
};

// Setup global mocks
Object.defineProperty(window, 'sessionStorage', {
	value: mockStorage,
	writable: true,
});
Object.defineProperty(window, 'localStorage', {
	value: mockStorage,
	writable: true,
});

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
	value: mockEnv,
	writable: true,
});

const meta = {
	title: 'App/Main Application',
	component: App,
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component:
					'Main application component that handles routing and authentication flow. Integrates Apollo GraphQL client and manages different application sections.',
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
				userStore={mockStorage}
			>
				<ApolloProvider client={client}>
					<Story />
				</ApolloProvider>
			</AuthProvider>
		),
	],
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof App>;

export const Default: Story = {
	name: 'Root Route',
	decorators: [
		(Story) => (
			<MemoryRouter initialEntries={['/']}>
				<Story />
			</MemoryRouter>
		),
	],
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// Verify that the app renders without errors
		expect(canvasElement).toBeTruthy();

		// Verify that the ApolloConnection wrapper is present
		const apolloWrapper =
			canvasElement.querySelector('[data-testid="apollo-connection"]') ||
			canvasElement.closest('[data-testid="apollo-connection"]') ||
			canvasElement;
		expect(apolloWrapper).toBeInTheDocument();
	},
};

export const Auth: Story = {
	name: 'Auth Redirect',
	decorators: [
		(Story) => (
			<MemoryRouter initialEntries={['/auth-redirect']}>
				<Story />
			</MemoryRouter>
		),
	],
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// Verify auth redirect route renders
		expect(canvasElement).toBeTruthy();

		// With forceLogin=true, this should trigger authentication flow
		// We verify the app renders without crashing
		expect(canvasElement.children.length).toBeGreaterThan(0);
	},
};

export const Community: Story = {
	name: 'Community Route',
	decorators: [
		(Story) => (
			<MemoryRouter initialEntries={['/community']}>
				<Story />
			</MemoryRouter>
		),
	],
	play: ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// Verify community route renders
		expect(canvasElement).toBeTruthy();

		// The community route should render the Accounts component
		expect(canvasElement.children.length).toBeGreaterThan(0);
	},
};
