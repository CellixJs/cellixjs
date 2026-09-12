import { PageHeader } from '@ant-design/pro-layout';
import { Helmet } from '@dr.pogodin/react-helmet';
import type React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PropertiesCreateContainer } from '../components/properties-create.container.tsx';
import { SubPageLayout } from '../sub-page-layout.tsx';

interface PropertiesCreateParams {
	communityId?: string;
	[key: string]: string | undefined;
}

export const PropertiesCreate: React.FC = () => {
	const navigate = useNavigate();
	const params = useParams<PropertiesCreateParams>();

	return (
		<SubPageLayout
			fixedHeader={false}
			header={
				<PageHeader
					title="Add Property"
					onBack={() => navigate('../')}
				/>
			}
		>
			<Helmet>
				<title>Add Property</title>
			</Helmet>
			<PropertiesCreateContainer data={{ communityId: params.communityId ?? '' }} />
		</SubPageLayout>
	);
};
