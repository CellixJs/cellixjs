import { RequireAuth } from '@cellix/ui-core';
import { Root as CommunityManagement } from '@ocom/ui-staff-route-community-management';
import { Root as Finance } from '@ocom/ui-staff-route-finance';
import { Root } from '@ocom/ui-staff-route-root';
import { Root as TechAdmin } from '@ocom/ui-staff-route-tech-admin';
import { Root as UserManagement } from '@ocom/ui-staff-route-user-management';
import { RequireRole, StaffAuthProvider, staffRouteRoles } from '@ocom/ui-staff-shared';
import { useAuth } from 'react-oidc-context';
import { Route, Routes } from 'react-router-dom';
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

	const staffSection = (
		<RequireAuth forceLogin={false}>
			<StaffAuthProvider value={identity}>
				<Routes>
					<Route
						path="/"
						element={
							<RequireRole roles={staffRouteRoles['/staff/community']}>
								<CommunityManagement />
							</RequireRole>
						}
					/>
					<Route
						path="/community/*"
						element={
							<RequireRole roles={staffRouteRoles['/staff/community']}>
								<CommunityManagement />
							</RequireRole>
						}
					/>
					<Route
						path="/users/*"
						element={
							<RequireRole roles={staffRouteRoles['/staff/users']}>
								<UserManagement />
							</RequireRole>
						}
					/>
					<Route
						path="/finance/*"
						element={
							<RequireRole roles={staffRouteRoles['/staff/finance']}>
								<Finance />
							</RequireRole>
						}
					/>
					<Route
						path="/tech/*"
						element={
							<RequireRole roles={staffRouteRoles['/staff/tech']}>
								<TechAdmin />
							</RequireRole>
						}
					/>
				</Routes>
			</StaffAuthProvider>
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
					path="/unauthorized"
					element={<Unauthorized />}
				/>
				<Route
					path="/staff/*"
					element={staffSection}
				/>
			</Routes>
		</ApolloConnection>
	);
}
