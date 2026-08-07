import { Layout } from 'antd';
import { AppFooter } from '../../molecules/app-footer/index.tsx';
import { AppHeader, type AppHeaderUser } from '../../molecules/app-header/index.tsx';
import type { OwnerCommunityThemeMode } from '../../../../theme/tokens.ts';

const { Content } = Layout;

export interface PublicShellProps {
	mode: OwnerCommunityThemeMode;
	onThemeChange: (isDark: boolean) => void;
	children: React.ReactNode;
	user?: AppHeaderUser | undefined;
	onLogin?: (() => void) | undefined;
	onSignUp?: (() => void) | undefined;
	onLogout?: (() => void) | undefined;
	className?: string | undefined;
}

export const PublicShell: React.FC<PublicShellProps> = ({ mode, onThemeChange, children, user, onLogin, onSignUp, onLogout, className }) => {
	return (
		<Layout className={className} style={{ minHeight: '100vh', backgroundColor: 'var(--oc-theme-background)' }}>
			<AppHeader
				mode={mode}
				onThemeChange={onThemeChange}
				user={user}
				onLogin={onLogin}
				onSignUp={onSignUp}
				onLogout={onLogout}
			/>
			<Content className="mx-auto" style={{ width: '100%', maxWidth: 'var(--oc-layout-max-width)', padding: 'var(--oc-layout-content-padding)', backgroundColor: 'var(--oc-theme-background)' }}>
				{children}
			</Content>
			<AppFooter />
		</Layout>
	);
};
