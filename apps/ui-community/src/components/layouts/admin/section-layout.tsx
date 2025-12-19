import { LoggedInUserContainer } from '@ocom/ui-components';
import { Layout, Menu, theme } from 'antd';
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import type { PageLayoutProps } from './index.tsx';

const { Header, Sider } = Layout;

interface SectionLayoutProps {
	pageLayouts: PageLayoutProps[];
}

export const SectionLayout: React.FC<SectionLayoutProps> = ({ pageLayouts }) => {
	const navigate = useNavigate();
	const [collapsed, setCollapsed] = useState(false);
	const {
		token: { colorBgContainer },
	} = theme.useToken();

	const menuItems = pageLayouts
		.filter((layout) => layout.parent === 'ROOT')
		.map((layout) => ({
			key: layout.path,
			icon: layout.icon,
			label: layout.title,
		}));

	const handleMenuClick = (e: { key: string }) => {
		navigate(e.key);
	};

	return (
		<Layout className="site-layout" style={{ minHeight: '100vh' }}>
			<Header
				style={{
					background: colorBgContainer,
				}}
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'row',
						justifyContent: 'flex-start',
						gap: '10px',
					}}
				>
					<LoggedInUserContainer autoLogin={true} />
				</div>
			</Header>

			<Layout>
				<Sider
					collapsible
					collapsed={collapsed}
					onCollapse={(value) => setCollapsed(value)}
					style={{
						background: colorBgContainer,
					}}
				>
					<Menu
						mode="inline"
						defaultSelectedKeys={['settings/*']}
						items={menuItems}
						onClick={handleMenuClick}
					/>
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
