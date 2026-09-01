import { PageHeader } from '@ant-design/pro-layout';
import { Helmet } from '@dr.pogodin/react-helmet';
import { SubPageLayout } from '@ocom/ui-community-shared';
import type React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MemberPropertiesDetailContainer } from '../components/member-properties-detail.container.tsx';

export const MemberPropertiesDetailPage: React.FC = () => {
	const navigate = useNavigate();
	const { id } = useParams<{ id?: string }>();

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
			<MemberPropertiesDetailContainer id={id ?? ''} />
		</SubPageLayout>
	);
};
