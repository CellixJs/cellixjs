import { PageHeader } from '@ant-design/pro-layout';
import { theme } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { MembersCreateContainer } from '../components/members-create.container.tsx';
import { SubPageLayout } from '../sub-page-layout.tsx';

export const MembersCreate: React.FC = () => {
	const navigate = useNavigate();
	const params = useParams();
	const {
		token: { colorTextBase },
	} = theme.useToken();

	return (
		<SubPageLayout
			fixedHeader={false}
			header={
				<PageHeader
					title={
						<span
							style={{
								color: colorTextBase,
							}}
						>
							Create Member
						</span>
					}
					onBack={() => navigate('../')}
				/>
			}
		>
			<MembersCreateContainer
				data={{ communityId: params.communityId ?? '' }}
			/>
		</SubPageLayout>
	);
};
