import { IdcardOutlined, ProfileOutlined, TeamOutlined } from '@ant-design/icons';
import { PageHeader } from '@ant-design/pro-layout';
import { VerticalTabs } from '@ocom/ui-shared';
import type React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SubPageLayout } from '../sub-page-layout.tsx';
import { MembersAccounts } from './members-accounts.tsx';
import { MembersGeneral } from './members-general.tsx';
import { MembersProfile } from './members-profile.tsx';

export const MembersDetail: React.FC = () => {
	const navigate = useNavigate();
	const params = useParams<{ id?: string }>();
	const memberIdParam = params.id ?? '';

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
			<VerticalTabs
				pages={[
					{
						id: `${memberIdParam}-general`,
						link: '',
						path: '',
						title: 'General',
						icon: <ProfileOutlined />,
						element: <MembersGeneral />,
					},
					{
						id: `${memberIdParam}-profile`,
						link: 'profile',
						path: 'profile',
						title: 'Profile',
						icon: <IdcardOutlined />,
						element: <MembersProfile />,
					},
					{
						id: `${memberIdParam}-accounts`,
						link: 'accounts',
						path: 'accounts/*',
						title: 'Accounts',
						icon: <TeamOutlined />,
						element: <MembersAccounts />,
					},
				]}
			/>
		</SubPageLayout>
	);
};
