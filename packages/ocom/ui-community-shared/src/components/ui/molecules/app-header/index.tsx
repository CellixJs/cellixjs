import { UserOutlined } from '@ant-design/icons';
import { Avatar, Layout, Space, Typography } from 'antd';
import { OwnerCommunityLogo } from '../../atoms/owner-community-logo/index.tsx';
import { ThemeToggle } from '../../atoms/theme-toggle/index.tsx';
import type { OwnerCommunityThemeMode } from '../../../../theme/tokens.ts';

const { Header } = Layout;
const { Text } = Typography;

export interface AppHeaderUser {
	firstName?: string | undefined;
	lastName?: string | undefined;
	avatarUrl?: string | undefined;
}

export interface AppHeaderProps {
	mode: OwnerCommunityThemeMode;
	onThemeChange: (isDark: boolean) => void;
	user?: AppHeaderUser | undefined;
	onLogin?: (() => void) | undefined;
	onSignUp?: (() => void) | undefined;
	onLogout?: (() => void) | undefined;
	className?: string | undefined;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ mode, onThemeChange, user, onLogin, onSignUp, onLogout, className }) => {
	const isDark = mode === 'dark';
	const isLoggedIn = Boolean(user);

	const avatarText = user?.firstName?.[0] ?? user?.lastName?.[0] ?? 'U';

	return (
		<Header
			className={className}
			role="banner"
			style={{
				height: 'var(--oc-layout-header-height)',
				paddingInline: 'var(--oc-spacing-md)',
				borderBottom: '1px solid var(--oc-theme-border-strong)',
				backgroundColor: 'var(--oc-theme-surface)',
			}}
		>
			<div
				className="flex items-center justify-between h-full mx-auto"
				style={{ maxWidth: 'var(--oc-layout-max-width)' }}
			>
				<OwnerCommunityLogo mode={mode} style={{ height: 60, width: 'auto' }} />

				<Space size="small" align="center">
					{isLoggedIn ? (
						<>
							<Avatar
								size={32}
								src={user?.avatarUrl}
								icon={!user?.avatarUrl ? <UserOutlined /> : undefined}
								aria-label={`${user?.firstName ?? ''} ${user?.lastName ?? ''} avatar`}
							>
								{!user?.avatarUrl ? avatarText : null}
							</Avatar>
							<Text>{user?.firstName ?? ''} {user?.lastName ? `${user.lastName.charAt(0)}.` : ''} |</Text>
						</>
					) : (
						<Text
							className="cursor-pointer"
							onClick={onLogin}
						>
							Log In |
						</Text>
					)}

					<ThemeToggle checked={isDark} onChange={(checked) => onThemeChange(checked)} />

					{isLoggedIn ? (
						<Text
							className="cursor-pointer"
							onClick={onLogout}
						>
							| Log Out
						</Text>
					) : (
						<Text
							className="cursor-pointer"
							onClick={onSignUp}
						>
							| Sign Up
						</Text>
					)}
				</Space>
			</div>
		</Header>
	);
};
