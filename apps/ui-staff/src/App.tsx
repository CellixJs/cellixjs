import { RequireAuth } from '@cellix/ui-core';
import { Route, Routes } from 'react-router-dom';
import { Root } from '@ocom/ui-staff-route-root';
import { Root as CommunityManagement } from '@ocom/ui-staff-route-community-management';
import { Root as UserManagement } from '@ocom/ui-staff-route-user-management';
import { Root as Finance } from '@ocom/ui-staff-route-finance';
import { Root as TechAdmin } from '@ocom/ui-staff-route-tech-admin';
import './App.css';
import { ApolloConnection } from './apollo-connection.tsx';
import { AuthLanding } from './index.tsx';
import { Unauthorized } from './unauthorized.tsx';

export default function App() {
	const rootSection = <Root />;

	const authSection = (
		<RequireAuth forceLogin={true}>
			<AuthLanding />
		</RequireAuth>
	);

	const staffSection = (
		<RequireAuth forceLogin={false}>
			<Routes>
				<Route path="/" element={<CommunityManagement />} />
				<Route path="/community/*" element={<CommunityManagement />} />
				<Route path="/users/*" element={<UserManagement />} />
				<Route path="/finance/*" element={<Finance />} />
				<Route path="/tech/*" element={<TechAdmin />} />
			</Routes>
		</RequireAuth>
	);

	return (
		<ApolloConnection>
			<Routes>
				<Route path="*" element={rootSection} />
				<Route path="/auth-redirect" element={authSection} />
				<Route path="/unauthorized" element={<Unauthorized />} />
				<Route path="/staff/*" element={staffSection} />
			</Routes>
		</ApolloConnection>
	);
}
