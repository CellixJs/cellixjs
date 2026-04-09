import { PageHeader } from '@ant-design/pro-layout';
import { theme } from 'antd';
import { Route, Routes } from 'react-router-dom';
import { MemberListContainer } from '../components/member-list.container.tsx';
import { MembersCreateContainer } from '../components/members-create.container.tsx';
import { MembersDetailContainer } from '../components/members-detail.container.tsx';
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
			<Routes>
				<Route
					path=""
					element={<MemberListContainer />}
				/>
				<Route
					path="create"
					element={<MembersCreateContainer />}
				/>
				<Route
					path=":memberId/*"
					element={<MembersDetailContainer />}
				/>
			</Routes>
		</SubPageLayout>
	);
};
