import { Layout, theme } from 'antd';
import type React from 'react';

const { Header, Content, Footer } = Layout;

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
				<Footer className="flex items-center mx-auto" style={{ height: '47px' }}>
					Owner Community
				</Footer>
			</div>
		</>
	);
};
