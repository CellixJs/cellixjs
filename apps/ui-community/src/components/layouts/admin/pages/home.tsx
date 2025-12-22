import { PageHeader } from '@ant-design/pro-layout';
import { theme } from 'antd';
import { useParams } from 'react-router-dom';
import { CommunityDetailContainer } from '../components/community-detail.container.tsx';
import { SubPageLayout } from '../sub-page-layout.tsx';

export const Home: React.FC = () => {
	const {
		token: { colorTextBase },
	} = theme.useToken();
	const params = useParams();

	return (
		<SubPageLayout
			fixedHeader={false}
			header={
				<PageHeader
					title={<span style={{ color: colorTextBase }}>Home</span>}
				/>
			}
		>
			<CommunityDetailContainer data={{ id: params.communityId }} />
		</SubPageLayout>
	);
};
