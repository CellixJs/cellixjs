import { Helmet } from '@dr.pogodin/react-helmet';
import { Typography } from 'antd';
import { CommunityListContainer } from '../components/community-list.container.tsx';
import { UserInfoContainer } from '../components/user-info.container.tsx';

const { Title, Text } = Typography;

export const Home: React.FC = () => {
	return (
		<main aria-label="Navigate communities">
			<Helmet>
				<title>Owner Community Home</title>
			</Helmet>
			<Title level={1}>Welcome to Owner Community!</Title>
			<Text>To join a community, you must provide the community manager with the following:</Text>
			<div className="mt-oc-lg mb-oc-lg">
				<UserInfoContainer />
			</div>
			<CommunityListContainer />
		</main>
	);
};
