import { RequireAuth } from '@cellix/ui-core';
import { HandleLogout } from '@ocom/ui-shared';
import { Root as CommunityManagement } from '@ocom/ui-staff-route-community-management';
import { Root as Finance } from '@ocom/ui-staff-route-finance';
import { Root } from '@ocom/ui-staff-route-root';
import { Root as TechAdmin } from '@ocom/ui-staff-route-tech-admin';
import { Root as UserManagement } from '@ocom/ui-staff-route-user-management';
import { StaffAuthContext, StaffAuthProvider } from '@ocom/ui-staff-shared';
import { Spin } from 'antd';
import { useContext } from 'react';
import { useAuth } from 'react-oidc-context';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { AuthLanding } from './components/ui/molecules/auth-landing/index.tsx';
import { client } from './components/ui/organisms/apollo-connection/apollo-client-links.tsx';
import { ApolloConnection } from './components/ui/organisms/apollo-connection/index.tsx';
import { useStaffPermissions } from './hooks/use-staff-permissions.ts';
import { Unauthorized } from './unauthorized.tsx';

function StaffRoutes() {
	const auth = useContext(StaffAuthContext);
	const perms = auth?.permissions;
	const canManageCommunities = perms?.canManageCommunities === true;
	const canManageUsers = perms?.canManageUsers === true;
	const canManageFinance = perms?.canManageFinance === true;
	const canManageTechAdmin = perms?.canManageTechAdmin === true;

	let defaultStaffRoute = '/unauthorized';
	if (canManageTechAdmin) {
		defaultStaffRoute = '/staff/tech';
	} else if (canManageFinance) {
		defaultStaffRoute = '/staff/finance';
	} else if (canManageCommunities) {
		defaultStaffRoute = '/staff/community-management';
	} else if (canManageUsers) {
		defaultStaffRoute = '/staff/user-management';
	}

	return (
		<Routes>
			<Route
				index
				element={
					<Navigate
						to={defaultStaffRoute}
						replace
					/>
				}
			/>
			{canManageCommunities && (
				<Route
					path="community-management/*"
					element={<CommunityManagement />}
				/>
			)}
			{(canManageUsers || canManageFinance) && (
				<Route
					path="user-management/*"
					element={<UserManagement />}
				/>
			)}
			{canManageFinance && (
				<Route
					path="finance/*"
					element={<Finance />}
				/>
			)}
			{canManageTechAdmin && (
				<Route
					path="tech/*"
					element={<TechAdmin />}
				/>
			)}
			<Route
				path="*"
				element={
					<Navigate
						to="/unauthorized"
						replace
					/>
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
		onLogout: () => HandleLogout(auth, client, globalThis.location.origin),
	};

	const authSection = (
		<RequireAuth forceLogin={true}>
			<AuthLanding />
		</RequireAuth>
	);

	const staffSectionElement = (
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

				{/* StaffSection renders StaffAuthProvider + StaffRoutes which handles all
				authenticated sub-routes with permission guards. No nested Route children
				are needed here because StaffRoutes defines its own Routes block. */}
				<Route
					path="/staff/*"
					element={staffSectionElement}
				/>
			</Routes>
		</ApolloConnection>
	);
}

function StaffSection({ identity }: { identity: Parameters<typeof StaffAuthProvider>[0]['value'] }) {
	const { permissions, enterpriseAppRole, user, loading } = useStaffPermissions();

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
				<Spin size="large" />
			</div>
		);
	}

	return (
		<StaffAuthProvider value={{ ...identity, permissions, enterpriseAppRole, name: user?.displayName, email: user?.email }}>
			<StaffRoutes />
		</StaffAuthProvider>
	);
}
