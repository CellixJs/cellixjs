import { PageHeader } from '@ant-design/pro-layout';
import { Helmet } from '@dr.pogodin/react-helmet';
import type React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PropertiesDetailContainer } from '../components/properties-detail.container.tsx';
import { SubPageLayout } from '../sub-page-layout.tsx';

export const PropertiesDetail: React.FC = () => {
	const navigate = useNavigate();
	const params = useParams<{ id?: string }>();

	return (
		<SubPageLayout
			fixedHeader={false}
			header={
				<PageHeader
					title="Property Details"
					onBack={() => navigate('../')}
				/>
			}
		>
			<Helmet>
				<title>Property Details</title>
			</Helmet>
			<PropertiesDetailContainer data={{ id: params.id ?? '' }} />
		</SubPageLayout>
	);
};
