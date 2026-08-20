import { HomeOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';
import { hasAcceptedAccountForUser, type PageLayoutProps } from '@ocom/ui-shared';
import type React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Home } from './pages/home.tsx';
import { Members } from './pages/members.tsx';
import { Properties } from './pages/properties.tsx';
import { Settings } from './pages/settings.tsx';
import { SectionLayoutContainer } from './section-layout.container.tsx';

interface AdminMenuData {
	member?: {
		isAdmin?: boolean | null;
		accounts?: Array<{
			statusCode?: string | null;
			user?: { id?: string | null } | null;
		} | null> | null;
		role?: {
			permissions?: {
				propertyPermissions?: {
					canManageProperties?: boolean | null;
				} | null;
			} | null;
		} | null;
	};
	currentEndUserId?: string | null;
}

export const Admin: React.FC = () => {
	const pageLayouts: PageLayoutProps[] = [
		{
			path: '/community/:communityId/admin/:memberId',
			title: 'Home',
			icon: <HomeOutlined />,
			id: 'ROOT',
		},
		{
			path: '/community/:communityId/admin/:memberId/members/*',
			title: 'Members',
			icon: <TeamOutlined />,
			id: 2,
			parent: 'ROOT',
			hasPermissions: (data: unknown) => {
				const adminData = data as AdminMenuData;
				return adminData?.member?.isAdmin ?? false;
			},
		},
		{
			path: '/community/:communityId/admin/:memberId/properties/*',
			title: 'Properties',
			icon: <HomeOutlined />,
			id: 3,
			parent: 'ROOT',
			hasPermissions: (data: unknown) => {
				const adminData = data as AdminMenuData;
				const canManageProperties = adminData?.member?.role?.permissions?.propertyPermissions?.canManageProperties ?? false;
				// Mirror the backend: property management also requires an ACCEPTED account for the current user.
				return canManageProperties && hasAcceptedAccountForUser(adminData?.member?.accounts, adminData?.currentEndUserId);
			},
		},
		{
			path: '/community/:communityId/admin/:memberId/settings/*',
			title: 'Settings',
			icon: <SettingOutlined />,
			id: 4,
			parent: 'ROOT',
			hasPermissions: (data: unknown) => {
				const adminData = data as AdminMenuData;
				return adminData?.member?.isAdmin ?? false;
			},
		},
	];

	return (
		<Routes>
			<Route
				path=""
				element={<SectionLayoutContainer pageLayouts={pageLayouts} />}
			>
				<Route
					path=""
					element={<Home />}
				/>
				<Route
					path="members/*"
					element={<Members />}
				/>
				<Route
					path="properties/*"
					element={<Properties />}
				/>
				<Route
					path="settings/*"
					element={<Settings />}
				/>
			</Route>
		</Routes>
	);
};
