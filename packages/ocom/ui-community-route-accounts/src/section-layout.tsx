import { PublicShell, type OwnerCommunityThemeMode } from '@ocom/ui-community-shared';
import { useAuth } from 'react-oidc-context';
import { Outlet } from 'react-router-dom';

export interface SectionLayoutProps {
	mode?: OwnerCommunityThemeMode | undefined;
	onThemeChange?: ((isDark: boolean) => void) | undefined;
}

export const SectionLayout: React.FC<SectionLayoutProps> = ({ mode = 'light', onThemeChange = () => undefined }) => {
	const auth = useAuth();
	const user = auth.user?.profile;
	const firstName = typeof user?.given_name === 'string' ? user.given_name : undefined;
	const lastName = typeof user?.family_name === 'string' ? user.family_name : undefined;

	const handleLogout = () => {
		void auth.removeUser();
		void auth.signoutRedirect();
	};

	return (
		<PublicShell
			mode={mode}
			onThemeChange={onThemeChange}
			user={{ firstName, lastName }}
			onLogout={handleLogout}
		>
			<Outlet />
		</PublicShell>
	);
};
