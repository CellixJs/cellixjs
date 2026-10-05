import { PageHeader } from '@ant-design/pro-layout';
import { theme } from 'antd';
import type React from 'react';
import { VideosListContainer } from '../components/videos-list.container.tsx';
import { SubPageLayout } from '../sub-page-layout.tsx';

export const VideosList: React.FC = () => {
	const {
		token: { colorTextBase },
	} = theme.useToken();

	return (
		<SubPageLayout
			fixedHeader={false}
			header={<PageHeader title={<span style={{ color: colorTextBase }}>Videos</span>} />}
		>
			<VideosListContainer />
		</SubPageLayout>
	);
};
