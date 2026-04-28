import { RequireAuth } from '@cellix/ui-core';
import { Route, Routes } from 'react-router-dom';
import { Root } from '@ocom/ui-staff-route-root';
import { Root as CommunityManagement } from '@ocom/ui-staff-route-community-management';
import { Root as UserManagement } from '@ocom/ui-staff-route-user-management';
import { Root as Finance } from '@ocom/ui-staff-route-finance';
import { Root as TechAdmin } from '@ocom/ui-staff-route-tech-admin';
import { StaffAuthProvider } from '@ocom/ui-staff-route-shared';
import { useAuth } from 'react-oidc-context';
import './App.css';
import { ApolloConnection } from './components/ui/organisms/apollo-connection/index.tsx';
import { AuthLanding } from './components/ui/molecules/auth-landing/index.tsx';
import { Unauthorized } from './unauthorized.tsx';

export default function App() {
	const rootSection = <Root />;
	const auth = useAuth();

	// Build a best-effort identity object to supply to shared placeholders

	// Provide a best-effort raw profile to the shared staff shell. StaffRouteShell will
	// attempt to extract display name and roles from this raw profile.
	const identity = {
		raw: (auth?.user?.profile as Record<string, unknown>) ?? undefined,
	};

	const authSection = (
		<RequireAuth forceLogin={true}>
			<AuthLanding />
		</RequireAuth>
	);

	const staffSection = (
		<RequireAuth forceLogin={false}>
			<StaffAuthProvider value={identity}>
				<Routes>
					<Route path="/" element={<CommunityManagement />} />
					<Route path="/community/*" element={<CommunityManagement />} />
					<Route path="/users/*" element={<UserManagement />} />
					<Route path="/finance/*" element={<Finance />} />
					<Route path="/tech/*" element={<TechAdmin />} />
				</Routes>
			</StaffAuthProvider>
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
