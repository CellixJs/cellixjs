import { DollarOutlined, HomeOutlined, LogoutOutlined, TeamOutlined, ToolOutlined } from '@ant-design/icons';
import { MenuComponent, type MenuComponentProps, type PageLayoutProps } from '@ocom/ui-shared';
import { Button, Layout, theme } from 'antd';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import './section-layout.css';

const { Sider, Header } = Layout;

const LocalSettingsKeys = {
	SidebarCollapsed: 'StaffSidebarCollapsed',
	LegacySidebarCollapsed: 'SidebarCollapsed',
} as const;

const handleToggler = (isExpanded: boolean, setIsExpanded: (value: boolean) => void) => {
	const newValue = !isExpanded;
	setIsExpanded(newValue);
	// Guard localStorage access in case this is executed during SSR or environments without window
	if (typeof window !== 'undefined' && 'localStorage' in window && typeof window.localStorage !== 'undefined') {
		try {
			if (newValue) {
				window.localStorage.removeItem(LocalSettingsKeys.SidebarCollapsed);
			} else {
				window.localStorage.setItem(LocalSettingsKeys.SidebarCollapsed, 'true');
			}
		} catch (_err) {
			// Ignore localStorage errors
		}
	}
};

export interface SectionLayoutProps {
	pageLayouts: PageLayoutProps[];
	memberData?: unknown;
	title?: string;
	description?: string;
	headerContent?: React.ReactNode;
	/** Optional injected communities dropdown (extension slot) */
	communitiesDropdown?: React.ReactNode;
	/** Optional injected logged in user component (extension slot). If not provided, a simple displayName + logout button is used. */
	loggedInUser?: React.ReactNode;
	/** Optional additional data to pass to communities dropdown (if used) */
	communitiesDropdownData?: Record<string, unknown>;
}

export const getUserIdentityFromMemberData = (memberData?: unknown) => {
	if (!memberData || typeof memberData !== 'object') {
		return null;
	}
	const data = memberData as Record<string, unknown>;
	// Narrow to a known shape for runtime-provided identity fields; support nested `raw` (OIDC profile)
	type MemberIdentity = {
		name?: string;
		username?: string;
		email?: string;
		raw?: { name?: string; preferred_username?: string; username?: string; email?: string };
		onLogout?: () => Promise<void> | void;
	};
	const d = data as unknown as MemberIdentity;
	const name = d.raw?.name ?? d.name;
	const username = d.raw?.preferred_username ?? d.raw?.username ?? d.username;
	const email = d.raw?.email ?? d.email;
	return {
		displayName: ((name as string) || (username as string) || (email as string) || 'Staff User') as string,
		onLogout: d.onLogout as (() => Promise<void> | void) | undefined,
	};
};

export const SectionLayout: React.FC<SectionLayoutProps> = ({
	pageLayouts,
	memberData,
	title,
	description: _description,
	headerContent,
	communitiesDropdown,
	loggedInUser,
	// NOTE: extension props (communitiesDropdown / loggedInUser) are optional and allow route packages to inject
}) => {
	// Support both legacy and staff-specific localStorage keys for sidebar collapsed state
	// Guard access to localStorage so this component is safe during server-side rendering (no window/localStorage)
	const [isExpanded, setIsExpanded] = useState(() => {
		if (typeof window === 'undefined') return true; // default to expanded during SSR
		if (!('localStorage' in window) || typeof window.localStorage === 'undefined') return true;
		try {
			const sidebarCollapsed = window.localStorage.getItem(LocalSettingsKeys.SidebarCollapsed) ?? window.localStorage.getItem(LocalSettingsKeys.LegacySidebarCollapsed);
			return !sidebarCollapsed;
		} catch (_err) {
			// If localStorage access throws, default to expanded
			return true;
		}
	});

	const {
		token: { colorBgContainer },
	} = theme.useToken();

	// Merge canonical staff navigation with consumer-provided pageLayouts.
	// Defaults are added only when the consumer hasn't provided an entry with the same id.
	// Consumer-provided entries override defaults when ids conflict.
	const defaultPageLayouts: PageLayoutProps[] = [
		{
			path: '/staff',
			title: 'Home',
			icon: <HomeOutlined />,
			id: 'ROOT',
		},
		{
			path: '/staff/community/*',
			title: 'Community Management',
			icon: <TeamOutlined />,
			id: 'community',
			parent: 'ROOT',
		},
		{
			path: '/staff/users/*',
			title: 'User Management',
			icon: <TeamOutlined />,
			id: 'users',
			parent: 'ROOT',
		},
		{
			path: '/staff/finance/*',
			title: 'Finance',
			icon: <DollarOutlined />,
			id: 'finance',
			parent: 'ROOT',
		},
		{
			path: '/staff/tech/*',
			title: 'Tech Admin',
			icon: <ToolOutlined />,
			id: 'tech',
			parent: 'ROOT',
		},
	];

	// Build a map from default entries, then overlay consumer entries so consumers can override defaults.
	// When consumers provide an entry with the same id, merge it with the default so that
	// missing fields (e.g., parent) are preserved from the default entry.
	const mergedMap = new Map<string | number, PageLayoutProps>();
	for (const p of defaultPageLayouts) {
		mergedMap.set(p.id, p);
	}
	for (const p of pageLayouts) {
		if (mergedMap.has(p.id)) {
			const existing = mergedMap.get(p.id) as PageLayoutProps;
			// Preserve default fields when consumer omits them; allow consumer to override when provided
			mergedMap.set(p.id, { ...existing, ...p });
		} else {
			mergedMap.set(p.id, p);
		}
	}

	const mergedPageLayouts = Array.from(mergedMap.values());

	const menuComponentProps: MenuComponentProps = {
		pageLayouts: mergedPageLayouts,
		memberData,
		theme: 'light',
		mode: 'inline',
	};

	const userIdentity = getUserIdentityFromMemberData(memberData);

	return (
		<Layout
			className="site-layout"
			style={{ minHeight: '100vh' }}
		>
			<Header
				style={{
					backgroundColor: colorBgContainer,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					paddingRight: '24px',
					paddingLeft: '24px',
				}}
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'row',
						justifyContent: 'flex-start',
						alignItems: 'center',
						gap: '24px',
						flex: 1,
					}}
				>
					{/** Render optional communities dropdown slot (mirrors community-admin pattern) */}
					{communitiesDropdown
						? // Provided by consumer (e.g., CommunitiesDropdownContainer)
							communitiesDropdown
						: null}

					{title && (
						<div
							style={{
								fontSize: '16px',
								fontWeight: 600,
								color: '#000',
							}}
						>
							{title}
						</div>
					)}
					{headerContent}
				</div>

				{/** Render logged-in user slot if provided, otherwise fallback to simple identity display */}
				{loggedInUser
					? loggedInUser
					: userIdentity && (
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '12px',
									marginLeft: 'auto',
								}}
							>
								<span style={{ fontSize: '14px', color: '#666' }}>{userIdentity.displayName}</span>
								{userIdentity.onLogout && (
									<Button
										type="text"
										icon={<LogoutOutlined />}
										onClick={userIdentity.onLogout}
										title="Logout"
										style={{ color: '#666' }}
									/>
								)}
							</div>
						)}
			</Header>

			<Layout hasSider={true}>
				<Sider
					theme="light"
					className="site-layout-background"
					collapsible
					collapsed={!isExpanded}
					onCollapse={() => handleToggler(isExpanded, setIsExpanded)}
					style={{
						overflow: 'auto',
						height: 'calc(100vh - 64px)',
						position: 'relative',
						left: 0,
						top: 0,
						bottom: 0,
						backgroundColor: colorBgContainer,
					}}
				>
					<div className="logo" />

					<MenuComponent {...menuComponentProps} />
				</Sider>

				<Layout
					style={{
						display: 'flex',
						flexDirection: 'column',
						flex: '1 auto',
						overflowY: 'scroll',
						height: 'calc(100vh - 64px)',
					}}
				>
					<Outlet />
				</Layout>
			</Layout>
		</Layout>
	);
};
