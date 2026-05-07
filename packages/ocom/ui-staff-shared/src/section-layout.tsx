import { DollarOutlined, TeamOutlined, ToolOutlined } from '@ant-design/icons';
import { MenuComponent, type MenuComponentProps, type PageLayoutProps } from '@ocom/ui-shared';
import { Layout, theme } from 'antd';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
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
}

export const SectionLayout: React.FC<SectionLayoutProps> = (props) => {
	// Guard access to localStorage so this component is safe during server-side rendering (no window/localStorage)
	const [isExpanded, setIsExpanded] = useState(() => {
		if (typeof window === 'undefined') return true; // default to expanded during SSR
		if (!('localStorage' in window) || typeof window.localStorage === 'undefined') return true;
		try {
			const sidebarCollapsed = window.localStorage.getItem(LocalSettingsKeys.SidebarCollapsed);
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
			path: '/staff/community-management',
			title: 'Communities',
			icon: <TeamOutlined />,
			id: 'ROOT',
		},
		{
			path: '/staff/user-management/*',
			title: 'Users',
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
							marginLeft: 'auto',
						}}
					>
						<span style={{ fontSize: '14px', color: '#666' }}>Staff User</span>
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
