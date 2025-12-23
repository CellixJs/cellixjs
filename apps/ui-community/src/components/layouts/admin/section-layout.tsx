import { LoggedInUserContainer } from '@ocom/ui-components';
import { Layout, theme } from 'antd';
import { useState } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import type { Member } from '../../../generated.tsx';
import { CommunitiesDropdownContainer } from '../../ui/organisms/dropdown-menu/communities-dropdown.container.tsx';
import { MenuComponent } from '../shared/components/menu-component.tsx';
import type { PageLayoutProps } from './index.tsx';
import './section-layout.css';

const { Sider, Header } = Layout;

const LocalSettingsKeys = {
	SidebarCollapsed: 'SidebarCollapsed',
} as const;

const handleToggler = (
	isExpanded: boolean,
	setIsExpanded: (value: boolean) => void,
) => {
	const newValue = !isExpanded;
	setIsExpanded(newValue);
	if (newValue) {
		localStorage.removeItem(LocalSettingsKeys.SidebarCollapsed);
	} else {
		localStorage.setItem(LocalSettingsKeys.SidebarCollapsed, 'true');
	}
};

interface AdminSectionLayoutProps {
	pageLayouts: PageLayoutProps[];
	memberData: Member;
}

export const SectionLayout: React.FC<AdminSectionLayoutProps> = (props) => {
	const params = useParams();
	const sidebarCollapsed = localStorage.getItem(
		LocalSettingsKeys.SidebarCollapsed,
	);
	const [isExpanded, setIsExpanded] = useState(!sidebarCollapsed);
	const {
		token: { colorBgContainer },
	} = theme.useToken();

	return (
		<Layout className="site-layout" style={{ minHeight: '100vh' }}>
			<Header
				style={{
					backgroundColor: colorBgContainer,
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
					<div style={{ display: 'flex' }} className="allowBoxShadow">
						<CommunitiesDropdownContainer
							data={{ id: params.communityId }}
						/>
					</div>
					<Link
						className="allowBoxShadow"
						to={`/community/${params.communityId}/member/${params.memberId}`}
					>
						View Member Site
					</Link>

					<LoggedInUserContainer autoLogin={true} />
				</div>
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

					<MenuComponent
						pageLayouts={props.pageLayouts}
						memberData={props.memberData}
						theme="light"
						mode="inline"
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
