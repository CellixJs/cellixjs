import { RequireAuth } from '@cellix/ui-core';
import { Root as CommunityManagement } from '@ocom/ui-staff-route-community-management';
import { Root as Finance } from '@ocom/ui-staff-route-finance';
import { Root } from '@ocom/ui-staff-route-root';
import { Root as TechAdmin } from '@ocom/ui-staff-route-tech-admin';
import { Root as UserManagement } from '@ocom/ui-staff-route-user-management';
import { StaffAuthProvider } from '@ocom/ui-staff-shared';
import { useAuth } from 'react-oidc-context';
import { Route, Routes, Outlet } from 'react-router-dom';
import './App.css';
import { AuthLanding } from './components/ui/molecules/auth-landing/index.tsx';
import { ApolloConnection } from './components/ui/organisms/apollo-connection/index.tsx';
import { Unauthorized } from './unauthorized.tsx';

export default function App() {
	const rootSection = <Root />;
	const auth = useAuth();

	// Build a best-effort identity object to supply to shared placeholders

	// Provide a best-effort raw profile to the shared staff shell. StaffRouteShell will
	// attempt to extract display name and roles from this raw profile.
	const identity = {
		raw: (auth?.user?.profile as Record<string, unknown>) ?? undefined,
		onLogout: () =>
			auth.signoutRedirect({
				post_logout_redirect_uri: globalThis.location.origin,
			}),
	};

	const authSection = (
		<RequireAuth forceLogin={true}>
			<AuthLanding />
		</RequireAuth>
	);

	// Staff section acts as the parent route element and must render an Outlet so
	// nested child routes declared in the top-level Routes are rendered in place.
	const staffSectionElement = (
		<RequireAuth forceLogin={false}>
			<StaffAuthProvider value={identity}>
				<Outlet />
			</StaffAuthProvider>
		</RequireAuth>
	);

	return (
		<ApolloConnection>
			<Routes>
				<Route path="*" element={rootSection} />
				<Route path="/auth-redirect" element={authSection} />
				<Route path="/unauthorized" element={<Unauthorized />} />

				{/* Parent staff route: child routes must be declared as nested Route elements
					so relative paths like "users/*" resolve against /staff. */}
				<Route path="/staff/*" element={staffSectionElement}>
					<Route index element={<CommunityManagement />} />
					<Route path="community/*" element={<CommunityManagement />} />
					<Route path="users/*" element={<UserManagement />} />
					<Route path="finance/*" element={<Finance />} />
					<Route path="tech/*" element={<TechAdmin />} />
				</Route>
			</Routes>
		</ApolloConnection>
	);
}
