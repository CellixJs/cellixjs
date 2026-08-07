import { Layout, Typography } from 'antd';

const { Footer } = Layout;
const { Text } = Typography;

export interface AppFooterProps {
	copyrightText?: string | undefined;
	className?: string | undefined;
}

export const AppFooter: React.FC<AppFooterProps> = ({ copyrightText = '©2020 Owner Community All Rights Reserved', className }) => {
	return (
		<Footer
			className={`text-center ${className ?? ''}`}
			role="contentinfo"
			style={{
				padding: 'var(--oc-layout-footer-padding-y) var(--oc-spacing-lg)',
			}}
		>
			<Text>{copyrightText}</Text>
		</Footer>
	);
};
