import { Typography } from 'antd';
import type React from 'react';

const { Text } = Typography;

export const LoginPage: React.FC = () => {
	return (
		<div style={{ margin: 0, padding: 24, minHeight: 'calc(100vh - var(--app-header-height, 50px))' }}>
			<Text
				strong
				style={{ fontSize: 24, display: 'block', marginBottom: 8 }}
			>
				Staff Portal
			</Text>
			<Text type="secondary">Sign in above to access the staff dashboard.</Text>
		</div>
	);
};
