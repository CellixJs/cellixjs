import { HomeOutlined, SettingOutlined } from '@ant-design/icons';
import { Route, Routes } from 'react-router-dom';
import type { Member } from '../../../generated.tsx';
import { Home } from './pages/home.tsx';
import { Settings } from './pages/settings.tsx';
import { SectionLayoutContainer } from './section-layout.container.tsx';

export interface PageLayoutProps {
	path: string;
	title: string;
	icon: React.JSX.Element;
	id: string | number;
	parent?: string;
	hasPermissions?: (member: Member) => boolean;
}

export const Admin: React.FC = () => {
	const pathLocations = {
		home: '',
		settings: 'settings/*',
	};

	const pageLayouts: PageLayoutProps[] = [
		{ path: pathLocations.home, title: 'Home', icon: <HomeOutlined />, id: 'ROOT' },
		{
			path: pathLocations.settings,
			title: 'Settings',
			icon: <SettingOutlined />,
			id: 2,
			parent: 'ROOT',
			// Note: Permission check would be:
			// hasPermissions: (member: Member) => member?.role?.permissions?.communityPermissions?.canManageCommunitySettings ?? false
			// Currently schema doesn't include role/permissions, so we allow all admin users to access settings
		},
	];

	return (
		<Routes>
			<Route path="" element={<SectionLayoutContainer pageLayouts={pageLayouts} />}>
				<Route path={pathLocations.home} element={<Home />} />
				<Route path={pathLocations.settings} element={<Settings />} />
			</Route>
		</Routes>
	);
};
