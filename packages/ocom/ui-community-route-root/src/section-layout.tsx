import { PublicShell, type OwnerCommunityThemeMode } from '@ocom/ui-community-shared';
import { useAuth } from 'react-oidc-context';
import { LandingPage } from './pages/landing-page.tsx';

export interface SectionLayoutProps {
	mode?: OwnerCommunityThemeMode | undefined;
	onThemeChange?: ((isDark: boolean) => void) | undefined;
}

export const SectionLayout: React.FC<SectionLayoutProps> = ({ mode = 'light', onThemeChange = () => undefined }) => {
	const auth = useAuth();

	const handleLogin = async () => {
		try {
			await auth.signinRedirect();
		} catch (err) {
			console.error('OIDC signinRedirect failed', err);
			const redirectUri = (import.meta as { env?: { VITE_APP_UI_COMMUNITY_END_USER_B2C_REDIRECT_URI?: string } }).env
				?.VITE_APP_UI_COMMUNITY_END_USER_B2C_REDIRECT_URI;
			if (redirectUri) {
				globalThis.location.href = redirectUri;
			}
		}
	};

	return (
		<PublicShell mode={mode} onThemeChange={onThemeChange} onLogin={handleLogin} onSignUp={handleLogin}>
			<LandingPage />
		</PublicShell>
	);
};
