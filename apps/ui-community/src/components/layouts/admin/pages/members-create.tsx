import { PageHeader } from '@ant-design/pro-layout';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from '@dr.pogodin/react-helmet';
import { SubPageLayout } from '../sub-page-layout.tsx';
import { MembersCreateContainer } from '../components/members-create.container.tsx';

interface MembersCreateParams {
	communityId?: string;
	[key: string]: string | undefined;
}

export const MembersCreate: React.FC = () => {
	const navigate = useNavigate();
	const params = useParams<MembersCreateParams>();

	return (
		<SubPageLayout
			fixedHeader={false}
			header={
				<PageHeader
					title="Create Member"
					onBack={() => navigate('../')}
				/>
			}
		>
			<Helmet>
				<title>Create Member</title>
			</Helmet>
			<MembersCreateContainer data={{ communityId: params.communityId ?? '' }} />
		</SubPageLayout>
	);
};
