import { PageHeader } from '@ant-design/pro-layout';
import { theme } from 'antd';
import { useParams } from 'react-router-dom';
import { MembersListContainer } from '../components/members-list.container.tsx';
import { SubPageLayout } from '../sub-page-layout.tsx';

export const MembersList: React.FC = () => {
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
							Members
						</span>
					}
				/>
			}
		>
			<MembersListContainer
				data={{ communityId: params.communityId ?? '' }}
			/>
		</SubPageLayout>
	);
};
