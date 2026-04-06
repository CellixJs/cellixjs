import { PageHeader } from '@ant-design/pro-layout';
import { theme } from 'antd';
import { MemberListContainer } from '../components/member-list.container.tsx';
import { SubPageLayout } from '../sub-page-layout.tsx';

export const Members: React.FC = () => {
	const {
		token: { colorTextBase },
	} = theme.useToken();

	return (
		<SubPageLayout
			fixedHeader={false}
			header={<PageHeader title={<span style={{ color: colorTextBase }}>Members</span>} />}
		>
			<MemberListContainer />
		</SubPageLayout>
	);
};
