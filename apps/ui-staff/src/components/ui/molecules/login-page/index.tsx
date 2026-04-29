import { Button, Typography } from 'antd';
import type React from 'react';
import { useAuth } from 'react-oidc-context';
import { Navigate } from 'react-router-dom';

const { Title } = Typography;

export const LoginPage: React.FC = () => {
	const auth = useAuth();

	if (auth.isAuthenticated) {
		return (
			<Navigate
				to="/staff/community"
				replace
			/>
		);
	}

	return (
		<div style={{ margin: 0, padding: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f0f2f5' }}>
			<div style={{ textAlign: 'center' }}>
				<Title level={2}>Staff Portal</Title>
				<Button
					type="primary"
					size="large"
					onClick={() => {
						void auth.signinRedirect();
					}}
				>
					Login
				</Button>
			</div>
		</div>
	);
};
