import { DollarOutlined, TeamOutlined, ToolOutlined } from '@ant-design/icons';
import { MenuComponent, type MenuComponentProps, type PageLayoutProps } from '@ocom/ui-shared';
import { Button, Layout, theme } from 'antd';
import { useContext, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { StaffAuthContext } from './staff-route-shell.tsx';
import './section-layout.css';

const { Sider, Header } = Layout;

const LocalSettingsKeys = {
	SidebarCollapsed: 'SidebarCollapsed',
} as const;

const handleToggler = (isExpanded: boolean, setIsExpanded: (value: boolean) => void) => {
	const newValue = !isExpanded;
	setIsExpanded(newValue);
	if (newValue) {
		localStorage.removeItem(LocalSettingsKeys.SidebarCollapsed);
	} else {
		localStorage.setItem(LocalSettingsKeys.SidebarCollapsed, 'true');
	}
};

export interface SectionLayoutProps {
	pageLayouts: PageLayoutProps[];
	memberData?: unknown;
	title?: string;
	description?: string;
	headerContent?: React.ReactNode;
	/** Optional injected logged in user component (extension slot). */
	loggedInUser?: React.ReactNode;
	/** Optional displayName from container (e.g., from GraphQL query). When provided, takes priority over auth context. */
	displayName?: string;
}

export const SectionLayout: React.FC<SectionLayoutProps> = (props) => {
	const auth = useContext(StaffAuthContext);

	// Debug logging to track displayName flow
	if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
		const href = window.location.href;
		if (href.includes('dev') || href.includes('localhost')) {
			console.debug('[SectionLayout] Component props & fallback chain:', {
				propsDisplayName: props.displayName,
				authName: auth?.name,
				authUsername: auth?.username,
				authEmail: auth?.email,
				resolvedDisplayName: props.displayName || auth?.name || auth?.username || auth?.email || 'Staff User',
			});
		}
	}

	// Guard access to localStorage so this component is safe during server-side rendering (no globalThis/localStorage)
	const [isExpanded, setIsExpanded] = useState(() => {
		if (typeof globalThis === 'undefined') return true; // default to expanded during SSR
		if (!('localStorage' in globalThis) || typeof globalThis.localStorage === 'undefined') return true;
		try {
			const sidebarCollapsed = globalThis.localStorage.getItem(LocalSettingsKeys.SidebarCollapsed);
			return !sidebarCollapsed;
		} catch (_err) {
			console.log('Error accessing localStorage, defaulting sidebar to expanded', _err);
			return true;
		}
	});

	const {
		token: { colorBgContainer },
	} = theme.useToken();

	// Merge canonical staff navigation with consumer-provided pageLayouts.
	// Defaults are added only when the consumer hasn't provided an entry with the same id.
	// Consumer-provided entries override defaults when ids conflict.
	// Build default page layouts from backend permissions.
	const perms = auth?.permissions;
	const canManageCommunities = perms?.canManageCommunities === true;
	const canManageUsers = perms?.canManageUsers === true;
	const canManageFinance = perms?.canManageFinance === true;
	const canManageTechAdmin = perms?.canManageTechAdmin === true;
	const nestedParentProps = canManageCommunities ? { parent: 'ROOT' as const } : {};

	// Construct default page layouts ensuring a ROOT entry always exists so MenuComponent renders.
	// If Communities is allowed, keep the historic behaviour: Communities is ROOT and others are its children.
	// Otherwise, promote the first available section to ROOT so a finance-only user sees a single Finance item.
	const defaultPageLayouts: PageLayoutProps[] = [];

	if (canManageCommunities) {
		// Communities as canonical root, others as children
		defaultPageLayouts.push({ path: '/staff/community-management', title: 'Communities', icon: <TeamOutlined />, id: 'ROOT' });
		if (canManageUsers) defaultPageLayouts.push({ path: '/staff/user-management/*', title: 'Users', icon: <TeamOutlined />, id: 'users', ...nestedParentProps });
		if (canManageFinance) defaultPageLayouts.push({ path: '/staff/finance/*', title: 'Finance', icon: <DollarOutlined />, id: 'finance', ...nestedParentProps });
		if (canManageTechAdmin) defaultPageLayouts.push({ path: '/staff/tech/*', title: 'Tech Admin', icon: <ToolOutlined />, id: 'tech', ...nestedParentProps });
	} else {
		// No Communities root. Promote the first available section to ROOT to render a single top-level item.
		if (canManageFinance) {
			defaultPageLayouts.push({ path: '/staff/finance/*', title: 'Finance', icon: <DollarOutlined />, id: 'ROOT' });
			// add others as children if present
			defaultPageLayouts.push({ path: '/staff/user-management/*', title: 'Users', icon: <TeamOutlined />, id: 'users', parent: 'ROOT' });
			if (canManageTechAdmin) defaultPageLayouts.push({ path: '/staff/tech/*', title: 'Tech Admin', icon: <ToolOutlined />, id: 'tech', parent: 'ROOT' });
		} else if (canManageUsers) {
			defaultPageLayouts.push({ path: '/staff/user-management/*', title: 'Users', icon: <TeamOutlined />, id: 'ROOT' });
			if (canManageTechAdmin) defaultPageLayouts.push({ path: '/staff/tech/*', title: 'Tech Admin', icon: <ToolOutlined />, id: 'tech', parent: 'ROOT' });
		} else if (canManageTechAdmin) {
			defaultPageLayouts.push({ path: '/staff/tech/*', title: 'Tech Admin', icon: <ToolOutlined />, id: 'ROOT' });
		}
	}

	// Build a map from default entries, then overlay consumer entries so consumers can override defaults.
	// When consumers provide an entry with the same id, merge it with the default so that
	// missing fields (e.g., parent) are preserved from the default entry.
	const mergedMap = new Map<string | number, PageLayoutProps>();
	for (const p of defaultPageLayouts) {
		mergedMap.set(p.id, p);
	}
	for (const p of props.pageLayouts) {
		if (mergedMap.has(p.id)) {
			const existing = mergedMap.get(p.id) as PageLayoutProps;
			// Preserve default title to enforce canonical short labels while allowing consumer
			// to override other non-title fields. This ensures consistent sidebar labels.
			mergedMap.set(p.id, { ...existing, ...p, title: existing.title });
		} else {
			mergedMap.set(p.id, p);
		}
	}

	const mergedPageLayouts = Array.from(mergedMap.values());

	const menuComponentProps: MenuComponentProps = {
		pageLayouts: mergedPageLayouts,
		memberData: props.memberData,
		theme: 'light',
		mode: 'inline',
	};

	return (
		<Layout
			className="site-layout"
			style={{ minHeight: '100vh' }}
		>
			<Header
				style={{
					backgroundColor: colorBgContainer,
					height: 'var(--app-header-height, 64px)',
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
					{props.title && (
						<div
							style={{
								fontSize: '16px',
								fontWeight: 600,
								color: '#000',
							}}
						>
							{props.title}
						</div>
					)}
					{props.headerContent}
				</div>

				{props.loggedInUser ?? (
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '12px',
							marginLeft: 'auto',
						}}
					>
						<span style={{ fontSize: '14px', color: '#666' }}>{props.displayName || auth?.name || auth?.username || auth?.email || 'Staff User'}</span>
						<Button
							type="link"
							onClick={() => auth?.onLogout?.()}
						>
							Log Out
						</Button>
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
						height: 'calc(100vh - var(--app-header-height, 64px))',
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
						height: 'calc(100vh - var(--app-header-height, 64px))',
					}}
				>
					<Outlet />
				</Layout>
			</Layout>
		</Layout>
	);
};
