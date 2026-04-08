import { IdcardOutlined, ProfileOutlined, TeamOutlined } from '@ant-design/icons';
import { PageHeader } from '@ant-design/pro-layout';
import { useNavigate } from 'react-router-dom';
import { Helmet } from '@dr.pogodin/react-helmet';
import { SubPageLayout } from '../sub-page-layout.tsx';
import { VerticalTabs, type RouteDefinition } from '../../../ui/organisms/vertical-tabs/index.tsx';
import { MembersGeneral } from './members-general.tsx';
import { MembersProfile } from './members-profile.tsx';
import { MembersAccounts } from './members-accounts.tsx';

export const MembersDetail: React.FC = () => {
	const navigate = useNavigate();

	const pages: RouteDefinition[] = [
		{ id: '1', link: '', path: '', title: 'General', icon: <ProfileOutlined />, element: <MembersGeneral /> },
		{ id: '2', link: 'profile', path: 'profile/*', title: 'Profile', icon: <IdcardOutlined />, element: <MembersProfile /> },
		{ id: '3', link: 'accounts', path: 'accounts/*', title: 'Accounts', icon: <TeamOutlined />, element: <MembersAccounts /> },
	];

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
			<Helmet>
				<title>Member Detail</title>
			</Helmet>
			<VerticalTabs pages={pages} />
		</SubPageLayout>
	);
};
