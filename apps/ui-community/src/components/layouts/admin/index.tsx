import { SettingOutlined } from '@ant-design/icons';
import { Route, Routes } from 'react-router-dom';
import { SectionLayout } from './section-layout.tsx';
import { Settings } from './pages/settings.tsx';

export interface PageLayoutProps {
	path: string;
	title: string;
	icon: React.JSX.Element;
	id: string | number;
	parent?: string;
}

export const Admin: React.FC = () => {
	const pageLayouts: PageLayoutProps[] = [
		{ path: '', title: 'Home', icon: <SettingOutlined />, id: 'ROOT' },
		{
			path: 'settings/*',
			title: 'Settings',
			icon: <SettingOutlined />,
			id: 2,
			parent: 'ROOT',
		},
	];

	return (
		<Routes>
			<Route path="" element={<SectionLayout pageLayouts={pageLayouts} />}>
				<Route path="settings/*" element={<Settings />} />
			</Route>
		</Routes>
	);
};
