import { Route, Routes } from 'react-router-dom';
import { CreateCommunity } from './pages/create-community.js';
import { Home } from './pages/home.js';
import { SectionLayout } from './section-layout.js';

export const Accounts: React.FC = () => {
	return (
		<Routes>
			<Route
				path=""
				element={<SectionLayout />}
			>
				<Route
					path="/"
					element={<Home />}
				/>
				<Route
					path="create-community"
					element={<CreateCommunity />}
				/>
			</Route>
		</Routes>
	);
};
