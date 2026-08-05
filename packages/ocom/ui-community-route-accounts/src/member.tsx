import { HomeOutlined, IdcardOutlined } from '@ant-design/icons';
import type { PageLayoutProps } from '@ocom/ui-shared';
import type React from 'react';
import { Route, Routes } from 'react-router-dom';
import { MemberSectionLayoutContainer } from './components/member-section-layout.container.tsx';
import { MemberHome } from './pages/member-home.tsx';
import { MemberProfilePage } from './pages/member-profile.tsx';

export const Member: React.FC = () => {
	const pageLayouts: PageLayoutProps[] = [
		{
			path: '/community/:communityId/member/:memberId',
			title: 'Home',
			icon: <HomeOutlined />,
			id: 'ROOT',
		},
		{
			path: '/community/:communityId/member/:memberId/profile',
			title: 'Profile',
			icon: <IdcardOutlined />,
			id: 2,
			parent: 'ROOT',
		},
	];

	return (
		<Routes>
			<Route
				path=""
				element={<MemberSectionLayoutContainer pageLayouts={pageLayouts} />}
			>
				<Route
					path=""
					element={<MemberHome />}
				/>
				<Route
					path="profile/*"
					element={<MemberProfilePage />}
				/>
			</Route>
		</Routes>
	);
};
