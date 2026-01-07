import { IdcardOutlined, ProfileOutlined } from '@ant-design/icons';
import { PageHeader } from '@ant-design/pro-layout';
import { theme } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { RouteDefinition } from '@cellix/ui-core';
import { VerticalTabs } from '@cellix/ui-core';
import { SubPageLayout } from '../sub-page-layout.tsx';
import { MembersGeneral } from './members-general.tsx';
import { MembersProfile } from './members-profile.tsx';

export const MembersDetail: React.FC = () => {
	const navigate = useNavigate();
	const {
		token: { colorTextBase },
	} = theme.useToken();

	const pages: RouteDefinition[] = [
		{
			id: '1',
			link: '',
			path: '',
			title: 'General',
			icon: <ProfileOutlined />,
			element: <MembersGeneral />,
		},
		{
			id: '2',
			link: 'profile',
			path: 'profile/*',
			title: 'Profile',
			icon: <IdcardOutlined />,
			element: <MembersProfile />,
		},
	];

	return (
		<SubPageLayout
			fixedHeader={false}
			header={
				<PageHeader
					title={
						<span
							style={{
								color: colorTextBase,
							}}
						>
							Member Detail
						</span>
					}
					onBack={() => navigate('../')}
				/>
			}
		>
			<VerticalTabs pages={pages} />
		</SubPageLayout>
	);
};
