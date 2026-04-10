import { Helmet } from '@dr.pogodin/react-helmet';
import { Typography } from 'antd';
import { CommunityListContainer } from '../components/community-list.container.js';
import { UserInfoContainer } from '../components/user-info.container.js';
import { SubPageLayout } from '../sub-page-layout.js';

const { Title } = Typography;

export const Home: React.FC = () => {
	return (
		<SubPageLayout
			fixedHeader={false}
			// biome-ignore lint:noUselessFragments
			header={<></>}
		>
			<Helmet>
				<title>Owner Community Home</title>
			</Helmet>
			<Title level={3}>Welcome to Owner Community</Title>
			To join a community, you must provide the community manager with the following:
			<br />
			<br />
			<UserInfoContainer />
			{/* <Button type="primary" onClick={onNavigateToAHP}>AHP Proof of Concepts</Button> */}
			<br />
			<br />
			<CommunityListContainer />
		</SubPageLayout>
	);
};
