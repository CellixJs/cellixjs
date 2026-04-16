import { Route, Routes, useParams } from 'react-router-dom';
import { MembersAccountsAddContainer } from '../components/members-accounts-add.container.tsx';
import { MembersAccountsEditContainer } from '../components/members-accounts-edit.container.tsx';
import { MembersAccountsListContainer } from '../components/members-accounts-list.container.tsx';

interface MembersAccountsParams {
	id?: string;
	communityId?: string;
	[key: string]: string | undefined;
}

export const MembersAccounts: React.FC = () => {
	const params = useParams<MembersAccountsParams>();

	return (
		<div>
			<h1>Members Accounts</h1>
			<Routes>
				<Route
					path=""
					element={<MembersAccountsListContainer data={{ id: params.id ?? '' }} />}
				/>
				<Route
					path="add"
					element={<MembersAccountsAddContainer data={{ id: params.id ?? '', communityId: params.communityId ?? '' }} />}
				/>
				<Route
					path=":accountId"
					element={<MembersAccountsEditContainer data={{ memberId: params.id ?? '', communityId: params.communityId ?? '' }} />}
				/>
			</Routes>
		</div>
	);
};
