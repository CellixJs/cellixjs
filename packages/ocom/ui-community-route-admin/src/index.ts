import { HomeOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';
import type { PageLayoutProps } from '@ocom/ui-components';
import { createElement, type FC } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Home } from './pages/home.tsx';
import { Members } from './pages/members.tsx';
import { Settings } from './pages/settings.tsx';
import { SectionLayoutContainer } from './section-layout.container.tsx';

export const Admin: FC = () => {
	const pageLayouts: PageLayoutProps[] = [
		{
			path: '/community/:communityId/admin/:memberId',
			title: 'Home',
			icon: createElement(HomeOutlined),
			id: 'ROOT',
		},
		{
			path: '/community/:communityId/admin/:memberId/members/*',
			title: 'Members',
			icon: createElement(TeamOutlined),
			id: 2,
			parent: 'ROOT',
		},
		{
			path: '/community/:communityId/admin/:memberId/settings/*',
			title: 'Settings',
			icon: createElement(SettingOutlined),
			id: 3,
			parent: 'ROOT',
			// Note: Permission check would be:
			// hasPermissions: (member: Member) => member?.role?.permissions?.communityPermissions?.canManageCommunitySettings ?? false
			// Currently schema doesn't include role/permissions, so we allow all admin users to access settings
		},
	];

	return createElement(
		Routes,
		undefined,
		createElement(
			Route,
			{
				path: '',
				element: createElement(SectionLayoutContainer, { pageLayouts }),
			},
			createElement(Route, {
				path: '',
				element: createElement(Home),
			}),
			createElement(Route, {
				path: 'members/*',
				element: createElement(Members),
			}),
			createElement(Route, {
				path: 'settings/*',
				element: createElement(Settings),
			}),
		),
	);
};
