import { useApolloClient, useLazyQuery } from '@apollo/client';
import { MaintenanceMessageProvider, type MaintenanceMessageProviderProps } from '@cellix/ui-core';
import { useCallback } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';
import { MaintenanceMessageProviderGetServerDateDocument } from '../../../generated.tsx';
import { HandleLogout } from '../header/handle-logout.tsx';

export type OcomMaintenanceMessageProviderProps = Omit<MaintenanceMessageProviderProps, 'runtime'>;

export function OcomMaintenanceMessageProvider(props: OcomMaintenanceMessageProviderProps) {
	const auth = useAuth();
	const apolloClient = useApolloClient();
	const navigate = useNavigate();
	const [queryServerDate] = useLazyQuery(MaintenanceMessageProviderGetServerDateDocument, { fetchPolicy: 'network-only' });
	const getServerDate = useCallback(async () => {
		const result = await queryServerDate();
		return result.data?.serverDate;
	}, [queryServerDate]);
	const onMaintenanceKickout = useCallback(() => {
		HandleLogout(auth, apolloClient, globalThis.location.origin);
		navigate('/');
	}, [auth, apolloClient, navigate]);

	return (
		<MaintenanceMessageProvider
			{...props}
			runtime={{ getServerDate, isAuthenticated: auth.isAuthenticated, onMaintenanceKickout }}
		/>
	);
}
