import { Route, Routes } from 'react-router-dom';
import { MembersList } from './members-list.tsx';

export const Members: React.FC = () => {
	return (
		<Routes>
			<Route path="" element={<MembersList />} />
		</Routes>
	);
};
