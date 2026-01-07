import { Route, Routes, useParams } from 'react-router-dom';
import { MembersAccountsListContainer } from '../components/members-accounts-list.container.tsx';

export const MembersAccounts: React.FC = () => {
	const params = useParams();
	return (
		<div>
			<h1>Members Accounts</h1>
			<Routes>
				<Route
					path=""
					element={
						<MembersAccountsListContainer data={{ id: params['id'] ?? '' }} />
					}
				/>
			</Routes>
		</div>
	);
};
