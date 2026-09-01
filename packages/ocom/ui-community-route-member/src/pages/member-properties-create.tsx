import { PageHeader } from '@ant-design/pro-layout';
import { Helmet } from '@dr.pogodin/react-helmet';
import { SubPageLayout } from '@ocom/ui-community-shared';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { MemberPropertiesCreateContainer } from '../components/member-properties-create.container.tsx';

export const MemberPropertiesCreatePage: React.FC = () => {
	const navigate = useNavigate();

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
			<MemberPropertiesCreateContainer />
		</SubPageLayout>
	);
};
