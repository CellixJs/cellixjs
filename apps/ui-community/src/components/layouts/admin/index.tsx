import { HomeOutlined, SettingOutlined } from '@ant-design/icons';
import { Route, Routes } from 'react-router-dom';
import { SectionLayout } from './section-layout.tsx';
import { Settings } from './pages/settings.tsx';
import { Home } from './pages/home.tsx';

export interface PageLayoutProps {
	path: string;
	title: string;
	icon: React.JSX.Element;
	id: string | number;
	parent?: string;
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
		},
	];

	return (
		<Routes>
			<Route path="" element={<SectionLayout pageLayouts={pageLayouts} />}>
				<Route path={pathLocations.home} element={<Home />} />
				<Route path={pathLocations.settings} element={<Settings />} />
			</Route>
		</Routes>
	);
};
