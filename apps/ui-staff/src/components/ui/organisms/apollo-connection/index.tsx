import { ApolloLink, ApolloProvider, from } from '@apollo/client';
import { RestLink } from 'apollo-link-rest';
import { type FC, useCallback, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useLocation } from 'react-router-dom';
import { ApolloLinkToAddAuthHeader, ApolloLinkToAddCustomHeader, BaseApolloLink, client, TerminatingApolloLinkForGraphqlServer } from './apollo-client-links.tsx';

interface ApolloConnectionProps {
	children: React.ReactNode;
}

export const ApolloConnection: FC<ApolloConnectionProps> = (props: ApolloConnectionProps) => {
	const auth = useAuth();
	const location = useLocation();

	const communityId = location.pathname.match(/\/community\/([a-f\d]{24})/i)?.[1] ?? null;
	const memberId = location.pathname.match(/\/(member|admin)\/([a-f\d]{24})/i)?.[2] ?? null;

	const apolloLinkChainForGraphqlDataSource = from([
		BaseApolloLink(),
		ApolloLinkToAddAuthHeader(auth),
		// NOTE: Using the same header name as ui-community for parity (x-community-id).
		// Issue #212 aims to align UI packages. If the staff backend requires a distinct
		// header (x-staff-id), coordinate with backend owners before reverting this change.
		ApolloLinkToAddCustomHeader('x-community-id', communityId, communityId !== 'accounts'),
		ApolloLinkToAddCustomHeader('x-member-id', memberId),
		TerminatingApolloLinkForGraphqlServer({
			// biome-ignore lint:useLiteralKeys
			uri: `${import.meta.env['VITE_FUNCTION_ENDPOINT']}`,
			batchMax: 15,
			batchInterval: 50,
		}),
	]);

	const apolloLinkChainForCountryDataSource = from([
		new RestLink({
			uri: 'https://countries.trevorblades.com/',
		}),
	]);

	const updateLink = useCallback(() => {
		const linkMap = {
			CountryDetails: apolloLinkChainForCountryDataSource,
			default: apolloLinkChainForGraphqlDataSource,
		};

		return ApolloLink.from([
			ApolloLink.split(
				(operation) => operation.operationName in linkMap,
				new ApolloLink((operation, forward) => {
					const link = linkMap[operation.operationName as keyof typeof linkMap] || linkMap.default;
					return link.request(operation, forward);
				}),
				apolloLinkChainForGraphqlDataSource,
			),
		]);
	}, [apolloLinkChainForGraphqlDataSource, apolloLinkChainForCountryDataSource]);

	useEffect(() => {
		client.setLink(updateLink());
	}, [updateLink]);

	return <ApolloProvider client={client}>{props.children}</ApolloProvider>;
};
