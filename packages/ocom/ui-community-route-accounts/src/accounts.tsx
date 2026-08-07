import type { OwnerCommunityThemeMode } from '@ocom/ui-community-shared';
import { Route, Routes } from 'react-router-dom';
import { CreateCommunity } from './pages/create-community.tsx';
import { Home } from './pages/home.tsx';
import { SectionLayout } from './section-layout.tsx';

export interface AccountsProps {
	mode?: OwnerCommunityThemeMode | undefined;
	onThemeChange?: ((isDark: boolean) => void) | undefined;
}

export const Accounts: React.FC<AccountsProps> = ({ mode = 'light', onThemeChange = () => undefined }) => {
	return (
		<Routes>
			<Route
				path=""
				element={<SectionLayout mode={mode} onThemeChange={onThemeChange} />}
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
