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
import { useStaffPermissions } from './hooks/use-staff-permissions.ts';
import { Unauthorized } from './unauthorized.tsx';

function StaffRoutes() {
	return (
		<Routes>
			<Route
				path="/"
				element={
					<RequireRole
						roles={staffRouteRoles['/staff/community']}
						permKey="canManageCommunities"
					>
						<CommunityManagement />
					</RequireRole>
				}
			/>
			<Route
				path="/community/*"
				element={
					<RequireRole
						roles={staffRouteRoles['/staff/community']}
						permKey="canManageCommunities"
					>
						<CommunityManagement />
					</RequireRole>
				}
			/>
			<Route
				path="/users/*"
				element={
					<RequireRole
						roles={staffRouteRoles['/staff/users']}
						permKey="canManageUser"
					>
						<UserManagement />
					</RequireRole>
				}
			/>
			<Route
				path="/finance/*"
				element={
					<RequireRole
						roles={staffRouteRoles['/staff/finance']}
						permKey="canManageFinance"
					>
						<Finance />
					</RequireRole>
				}
			/>
			<Route
				path="/tech/*"
				element={
					<RequireRole
						roles={staffRouteRoles['/staff/tech']}
						permKey="canManageTechAdmin"
					>
						<TechAdmin />
					</RequireRole>
				}
			/>
		</Routes>
	);
}

export default function App() {
	const rootSection = <Root />;
	const auth = useAuth();

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
			<StaffSection identity={identity} />
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

function StaffSection({ identity }: { identity: Parameters<typeof StaffAuthProvider>[0]['value'] }) {
	const { permissions } = useStaffPermissions();

	return (
		<StaffAuthProvider value={{ ...identity, permissions }}>
			<StaffRoutes />
		</StaffAuthProvider>
	);
}
