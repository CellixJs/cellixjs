import { RequireAuth } from '@cellix/ui-core';
import { Accounts } from '@ocom/ui-community-route-accounts';
import { Admin } from '@ocom/ui-community-route-admin';
import { Root } from '@ocom/ui-community-route-root';
import { MaintenanceMessage, MaintenanceMessageProvider, useMaintenanceMessage } from '@ocom/ui-shared';
import { Route, Routes } from 'react-router-dom';
import './App.css';
import { AuthLanding } from './components/ui/molecules/auth-landing/index.tsx';
import { ApolloConnection } from './components/ui/organisms/apollo-connection/index.tsx';

export default function App() {
	const authSection = (
		<RequireAuth forceLogin={true}>
			<AuthLanding />
		</RequireAuth>
	);

	const rootSection = <Root />;

	return (
		<ApolloConnection>
			<MaintenanceMessageProvider portalKey="UI_COMMUNITY_PORTAL">
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
			</MaintenanceMessageProvider>
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

	return <RequireAuth forceLogin={false}>{isMaintenance ? <MaintenanceMessage portalKey="UI_COMMUNITY_PORTAL" /> : routes}</RequireAuth>;
}
