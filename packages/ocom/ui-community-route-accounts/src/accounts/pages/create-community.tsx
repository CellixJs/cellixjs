import { PageHeader } from '@ant-design/pro-layout';
import { useNavigate } from 'react-router-dom';
import { CommunityCreateContainer } from '../components/community-create.container.js';
import { SubPageLayout } from '../sub-page-layout.js';

export const CreateCommunity: React.FC = () => {
	const navigate = useNavigate();
	return (
		<SubPageLayout
			fixedHeader={false}
			header={
				<PageHeader
					title="Create a Community"
					onBack={() => navigate('../')}
				/>
			}
		>
			<CommunityCreateContainer />
		</SubPageLayout>
	);
};
