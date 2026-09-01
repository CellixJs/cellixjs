import { HomeOutlined } from '@ant-design/icons';
import { PageHeader } from '@ant-design/pro-layout';
import { SubPageLayout } from '@ocom/ui-community-shared';
import { Button, theme } from 'antd';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { MemberPropertiesListContainer } from '../components/member-properties-list.container.tsx';

export const MemberPropertiesListPage: React.FC = () => {
	const navigate = useNavigate();
	const {
		token: { colorTextBase },
	} = theme.useToken();

	return (
		<SubPageLayout
			fixedHeader={false}
			header={
				<PageHeader
					title={<span style={{ color: colorTextBase }}>Properties</span>}
					extra={[
						<Button
							key="create"
							type="primary"
							onClick={() => navigate('create')}
							icon={<HomeOutlined />}
						>
							Add Property
						</Button>,
					]}
				/>
			}
		>
			<MemberPropertiesListContainer />
		</SubPageLayout>
	);
};
