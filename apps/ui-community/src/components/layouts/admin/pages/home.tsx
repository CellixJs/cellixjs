import { PageHeader } from '@ant-design/pro-layout';
import { theme } from 'antd';
import { SubPageLayout } from '../sub-page-layout.tsx';

export const Home: React.FC = () => {
	const {
		token: { colorTextBase },
	} = theme.useToken();
	
	return (
		<SubPageLayout
			fixedHeader={false}
			header={
				<PageHeader
					title={<span style={{ color: colorTextBase }}>Home</span>}
				/>
			}
		>
			<div>
				<h2>Welcome to Community Admin</h2>
				<p>Use the menu on the left to navigate to different sections.</p>
			</div>
		</SubPageLayout>
	);
};
