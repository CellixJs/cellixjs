import { IdcardOutlined, ProfileOutlined, TeamOutlined } from '@ant-design/icons';
import { PageHeader } from '@ant-design/pro-layout';
import { Tabs } from 'antd';
import { Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { SubPageLayout } from '../sub-page-layout.tsx';
import { MembersAccounts } from './members-accounts.tsx';
import { MembersGeneral } from './members-general.tsx';
import { MembersProfileEdit } from './members-profile-edit.tsx';
import { MembersProfile } from './members-profile.tsx';

export const MembersDetail: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const params = useParams<{ communityId?: string; memberId?: string; id?: string }>();
	const communityId = params.communityId ?? '';
	const memberId = params.memberId ?? '';
	const memberIdParam = params.id ?? '';
	const basePath = `/community/${communityId}/admin/${memberId}/members/${memberIdParam}`;

	const activeTab = location.pathname.includes('/accounts') ? 'accounts' : location.pathname.includes('/profile') ? 'profile' : 'general';

	const handleTabChange = (key: string) => {
		// Build absolute path to ensure sibling tab navigation works from any current nested route
		const route = key === 'general' ? basePath : `${basePath}/${key}`;
		navigate(route);
	};

	return (
		<SubPageLayout
			fixedHeader={false}
			header={
				<PageHeader
					title="Member Detail"
					onBack={() => navigate('../')}
				/>
			}
		>
			<Tabs
				activeKey={activeTab}
				onChange={handleTabChange}
				items={[
					{ key: 'general', label: 'General', icon: <ProfileOutlined /> },
					{ key: 'profile', label: 'Profile', icon: <IdcardOutlined /> },
					{ key: 'accounts', label: 'Accounts', icon: <TeamOutlined /> },
				]}
			/>
			<Routes>
				<Route
					path=""
					element={<MembersGeneral />}
				/>
				<Route
					path="profile"
					element={<MembersProfile />}
				/>
				<Route
					path="profile/edit"
					element={<MembersProfileEdit />}
				/>
				<Route
					path="accounts/*"
					element={<MembersAccounts />}
				/>
			</Routes>
		</SubPageLayout>
	);
};
