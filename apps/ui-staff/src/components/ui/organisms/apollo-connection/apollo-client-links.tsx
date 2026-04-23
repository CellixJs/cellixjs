import { ApolloClient, ApolloLink, type DefaultContext, from, InMemoryCache } from '@apollo/client';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { setContext } from '@apollo/client/link/context';
import type { UriFunction } from '@apollo/client/link/http';
import { removeTypenameFromVariables } from '@apollo/client/link/remove-typename';
import type { AuthContextProps } from 'react-oidc-context';

// apollo client instance
export const client = new ApolloClient({
	cache: new InMemoryCache(),
	devtools: {
		// biome-ignore lint:useLiteralKeys
		enabled: import.meta.env['NODE_ENV'] !== 'production',
	},
});

// base apollo link with no customizations
// could be used as a base for the link chain
export const BaseApolloLink = (): ApolloLink =>
	setContext((_, { headers }) => {
		return {
			headers: {
				...headers,
			},
		};
	});

// apollo link to add auth header
export const ApolloLinkToAddAuthHeader = (auth: AuthContextProps): ApolloLink =>
	setContext((_, { headers }) => {
		// Prefer token from react-oidc-context if available; otherwise, fall back to storage.
		let access_token: string | undefined = auth.user?.access_token;
		// In development, fall back to storage to avoid a brief race on refresh.
		// In production, rely solely on react-oidc-context to provide the user/token.
		if (!access_token && typeof globalThis !== 'undefined' && !import.meta.env.PROD) {
			try {
				// biome-ignore lint:useLiteralKeys
				const authority = import.meta.env['VITE_AAD_B2C_ACCOUNT_AUTHORITY'] ?? '';
				// biome-ignore lint:useLiteralKeys
				const client_id = import.meta.env['VITE_AAD_B2C_ACCOUNT_CLIENTID'] ?? '';
				const storageKey = `oidc.user:${authority}:${client_id}`;
				const raw = globalThis.sessionStorage.getItem(storageKey) ?? globalThis.localStorage.getItem(storageKey);
				if (raw) {
					const parsed = JSON.parse(raw);
					access_token = typeof parsed?.access_token === 'string' ? parsed.access_token : undefined;
				}
			} catch {
				// ignore parse/storage errors and proceed without auth header
			}
		}
		return {
			headers: {
				...headers,
				...(access_token && { Authorization: `Bearer ${access_token}` }),
			},
		};
	});

// apollo link to add custom header
export const ApolloLinkToAddCustomHeader = (headerName: string, headerValue: string | null | undefined, ifTrue?: boolean): ApolloLink =>
	new ApolloLink((operation, forward) => {
		if (!headerValue || (ifTrue !== undefined && ifTrue === false)) {
			return forward(operation);
		}
		operation.setContext((prevContext: DefaultContext) => {
			// Avoid mutating prevContext or prevContext.headers. Return a new context object instead.
			// biome-ignore lint:useLiteralKeys
			const prevHeaders = (prevContext && (prevContext as Record<string, unknown>)['headers']) ?? {};
			return {
				...prevContext,
				headers: {
					...prevHeaders,
					[headerName]: headerValue,
				},
			};
		});
		return forward(operation);
	});

// apollo link to batch graphql requests
// includes removeTypenameFromVariables link
export const TerminatingApolloLinkForGraphqlServer = (config: BatchHttpLink.Options) => {
	const batchHttpLink = new BatchHttpLink({
		uri: config.uri as string | UriFunction,
		batchMax: Number(config.batchMax), // No more than 15 operations per batch
		batchInterval: Number(config.batchInterval), // Wait no more than 50ms after first batched operation
	});
	return from([removeTypenameFromVariables(), batchHttpLink]);
};
