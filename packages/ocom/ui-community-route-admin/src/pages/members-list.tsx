import { UsergroupAddOutlined } from '@ant-design/icons';
import { PageHeader } from '@ant-design/pro-layout';
import { Button, theme } from 'antd';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { MemberListContainer } from '../components/members-list.container.tsx';
import { SubPageLayout } from '../sub-page-layout.tsx';

export const MembersList: React.FC = () => {
	const navigate = useNavigate();
	const {
		token: { colorTextBase },
	} = theme.useToken();

	return (
		<SubPageLayout
			fixedHeader={false}
			header={
				<PageHeader
					title={<span style={{ color: colorTextBase }}>Members</span>}
					extra={[
						<Button
							key="create"
							type="primary"
							onClick={() => navigate('create')}
							icon={<UsergroupAddOutlined />}
						>
							Create Member
						</Button>,
					]}
				/>
			}
		>
			<MemberListContainer />
		</SubPageLayout>
	);
};
