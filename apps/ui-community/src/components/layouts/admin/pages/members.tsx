import type React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Helmet } from '@dr.pogodin/react-helmet';
import { MembersList } from './members-list.tsx';
import { MembersCreate } from './members-create.tsx';
import { MembersDetail } from './members-detail.tsx';

export const Members: React.FC = () => {
	return (
		<>
			<Helmet>
				<title>Members</title>
			</Helmet>
			<Routes>
				<Route
					path=""
					element={<MembersList />}
				/>
				<Route
					path="/create"
					element={<MembersCreate />}
				/>
				<Route
					path="/:id/*"
					element={<MembersDetail />}
				/>
			</Routes>
		</>
	);
};
