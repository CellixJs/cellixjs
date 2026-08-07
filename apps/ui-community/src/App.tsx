import { RequireAuth } from '@cellix/ui-core';
import { Accounts } from '@ocom/ui-community-route-accounts';
import { Admin } from '@ocom/ui-community-route-admin';
import { Root } from '@ocom/ui-community-route-root';
import { useContext } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthLanding } from './components/ui/molecules/auth-landing/index.tsx';
import { ApolloConnection } from './components/ui/organisms/apollo-connection/index.tsx';
import { ThemeContext } from './contexts/theme-context.tsx';

export default function App() {
	const { mode, toggleTheme } = useContext(ThemeContext);
	const handleThemeChange = (isDark: boolean) => {
		const expectedMode = isDark ? 'dark' : 'light';
		if (expectedMode !== mode) {
			toggleTheme();
		}
	};

	const authSection = (
		<RequireAuth forceLogin={true}>
			<AuthLanding />
		</RequireAuth>
	);

	const rootSection = <Root mode={mode} onThemeChange={handleThemeChange} />;

	const communitySection = (
		<RequireAuth forceLogin={false}>
			<Routes>
				<Route
					path="/"
					element={<Accounts mode={mode} onThemeChange={handleThemeChange} />}
				/>
				<Route
					path="/accounts/*"
					element={<Accounts mode={mode} onThemeChange={handleThemeChange} />}
				/>
				<Route
					path="/:communityId/admin/:memberId/*"
					element={<Admin />}
				/>
			</Routes>
		</RequireAuth>
	);

	return (
		<ApolloConnection>
			<Routes>
				<Route
					path="/auth-redirect"
					element={authSection}
				/>
				<Route
					path="/community/*"
					element={communitySection}
				/>
				<Route
					path="*"
					element={rootSection}
				/>
			</Routes>
		</ApolloConnection>
	);
}
