import { Layout, theme } from 'antd';
import type React from 'react';

const { Header, Content, Footer } = Layout;

/**
 * SubPageLayout - Extension point for staff section pages
 *
 * Provides a flexible layout for staff pages with optional header and content areas.
 * Commonly used with VerticalTabs for tabbed content within a staff section page.
 *
 * @example
 * ```tsx
 * <SubPageLayout
 *   header={<PageHeader title="User Details" onBack={() => navigate('../')} />}
 *   fixedHeader={false}
 * >
 *   <VerticalTabs pages={tabPages} />
 * </SubPageLayout>
 * ```
 */
interface SubPageLayoutProps {
	header: React.JSX.Element;
	fixedHeader?: boolean;
	children?: React.ReactNode;
}

export const SubPageLayout: React.FC<SubPageLayoutProps> = (props) => {
	const {
		token: { colorText, colorBgContainer },
	} = theme.useToken();
	const overFlow = props.fixedHeader ? 'scroll' : 'unset';
	return (
		<>
			<Header
				style={{
					padding: 0,
					height: 'fit-content',
					color: colorText,
					backgroundColor: colorBgContainer,
				}}
			>
				{props.header}
			</Header>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					flex: '1 auto',
					overflowY: overFlow,
					backgroundColor: colorBgContainer,
				}}
			>
				<Content style={{ margin: '24px 16px 0', minHeight: 'inherit' }}>
					<div style={{ padding: 24, minHeight: '100%' }}>{props.children}</div>
				</Content>
				<Footer
					className="flex items-center mx-auto"
					style={{ height: '47px' }}
				>
					Staff Portal
				</Footer>
			</div>
		</>
	);
};
