import { Route, Routes } from 'react-router-dom';
import { MembersCreate } from './members-create.tsx';
import { MembersDetail } from './members-detail.tsx';
import { MembersList } from './members-list.tsx';

export const Members: React.FC = () => {
	return (
		<Routes>
			<Route path="" element={<MembersList />} />
			<Route path="/create" element={<MembersCreate />} />
			<Route path="/:id/*" element={<MembersDetail />} />
		</Routes>
	);
};
