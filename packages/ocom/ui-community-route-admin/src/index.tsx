import { HomeOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';
import type { PageLayoutProps } from '@ocom/ui-components';
import type React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Home } from './pages/home.tsx';
import { Members } from './pages/members.tsx';
import { Settings } from './pages/settings.tsx';
import { SectionLayoutContainer } from './section-layout.container.tsx';

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
			// hasPermissions: (member: Member) => member?.isAdmin ?? false
		},
		{
			path: '/community/:communityId/admin/:memberId/settings/*',
			title: 'Settings',
			icon: <SettingOutlined />,
			id: 3,
			parent: 'ROOT',
			// Note: Permission check would be:
			// hasPermissions: (member: Member) => member?.role?.permissions?.communityPermissions?.canManageCommunitySettings ?? false
			// Currently schema doesn't include role/permissions, so we allow all admin users to access settings
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
					path="settings/*"
					element={<Settings />}
				/>
			</Route>
		</Routes>
	);
};
