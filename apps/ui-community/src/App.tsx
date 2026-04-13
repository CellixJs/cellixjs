import { RequireAuth } from '@cellix/ui-core';
import { Route, Routes } from 'react-router-dom';
import './App.css';
import { Accounts } from '@ocom/ui-community-route-accounts';
import { Admin } from '@ocom/ui-community-route-admin';
import { Root } from '@ocom/ui-community-route-root';
import { AuthLanding } from './components/ui/molecules/auth-landing/index.tsx';
import { ApolloConnection } from './components/ui/organisms/apollo-connection/index.tsx';

export default function App() {
	const authSection = (
		<RequireAuth forceLogin={true}>
			<AuthLanding />
		</RequireAuth>
	);

	const rootSection = <Root />;

	const communitySection = (
		<RequireAuth forceLogin={false}>
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
		</RequireAuth>
	);

	return (
		<ApolloConnection>
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
					element={communitySection}
				/>
			</Routes>
		</ApolloConnection>
	);
}
