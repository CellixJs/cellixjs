import { PageHeader } from '@ant-design/pro-layout';
import { theme } from 'antd';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { VideosDetailContainer } from '../components/videos-detail.container.tsx';
import { SubPageLayout } from '../sub-page-layout.tsx';

export const VideosDetail: React.FC = () => {
	const navigate = useNavigate();
	const {
		token: { colorTextBase },
	} = theme.useToken();

	return (
		<SubPageLayout
			fixedHeader={false}
			header={
				<PageHeader
					title={<span style={{ color: colorTextBase }}>Video</span>}
					onBack={() => navigate('..')}
				/>
			}
		>
			<VideosDetailContainer />
		</SubPageLayout>
	);
};
