import { MaintenanceMessage, RequireAuth, useMaintenanceMessage } from '@cellix/ui-core';
import { Accounts } from '@ocom/ui-community-route-accounts';
import { Admin } from '@ocom/ui-community-route-admin';
import { Root } from '@ocom/ui-community-route-root';
import { maintenanceMessageDisplayConfig, maintenancePortalKeys, OcomMaintenanceMessageProvider } from '@ocom/ui-shared';
import { Route, Routes } from 'react-router-dom';
import './App.css';
import { AuthLanding } from './components/ui/molecules/auth-landing/index.tsx';
import { ApolloConnection } from './components/ui/organisms/apollo-connection/index.tsx';

export default function App() {
	const timeoutBeforeMaintenance = Number(import.meta.env['VITE_APP_UI_COMMUNITY_TIMEOUT_BEFORE_MAINTENANCE']);
	const authSection = (
		<RequireAuth forceLogin={true}>
			<AuthLanding />
		</RequireAuth>
	);

	const rootSection = <Root />;

	return (
		<ApolloConnection>
			<OcomMaintenanceMessageProvider
				portalKey={maintenancePortalKeys.community}
				timeoutBeforeMaintenance={timeoutBeforeMaintenance}
			>
				<Routes>
					<Route
						path="*"
						element={rootSection}
					/>
					<Route
						path="/auth-redirect"
						element={authSection}
					/>
					<Route
						path="/community/*"
						element={<CommunitySection />}
					/>
				</Routes>
			</OcomMaintenanceMessageProvider>
		</ApolloConnection>
	);
}

function CommunitySection() {
	const { isMaintenance } = useMaintenanceMessage();

	const routes = (
		<Routes>
			<Route
				path="/"
				element={<Accounts />}
			/>
			<Route
				path="/accounts/*"
				element={<Accounts />}
			/>
			<Route
				path="/:communityId/admin/:memberId/*"
				element={<Admin />}
			/>
		</Routes>
	);

	return (
		<RequireAuth forceLogin={false}>
			{isMaintenance ? (
				<MaintenanceMessage
					portalKey={maintenancePortalKeys.community}
					displayConfig={maintenanceMessageDisplayConfig}
				/>
			) : (
				routes
			)}
		</RequireAuth>
	);
}
