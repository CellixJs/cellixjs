import { Row, Space, Spin, Typography } from 'antd';
import type React from 'react';
import { useEffect } from 'react';
import { hasAuthParams, useAuth } from 'react-oidc-context';
import { Navigate, useLocation } from 'react-router-dom';

export interface RequireAuthProps {
	children: React.JSX.Element;
	forceLogin?: boolean;
}

export const RequireAuth: React.FC<RequireAuthProps> = (props) => {
	const auth = useAuth();
	const location = useLocation();
	const isHandlingAuthCallback = hasAuthParams();

	// automatically sign-in
	useEffect(() => {
		if (!isHandlingAuthCallback && props.forceLogin === true && !auth.isAuthenticated && !auth.activeNavigator && !auth.isLoading && !auth.error) {
			window.sessionStorage.setItem('redirectTo', `${location.pathname}${location.search}`);

			auth.signinRedirect();
		}
	}, [auth.isAuthenticated, auth.activeNavigator, auth.isLoading, auth.signinRedirect, auth.error, isHandlingAuthCallback, location.pathname, location.search, props.forceLogin]);

	if (auth.isLoading || auth.activeNavigator || isHandlingAuthCallback) {
		return (
			<Row
				justify={'center'}
				style={{ height: '100vh', alignItems: 'center' }}
			>
				<Space
					size={'large'}
					direction="vertical"
					style={{ textAlign: 'center' }}
				>
					<Spin size="large" />
					<Typography.Title level={2}>Please wait...</Typography.Title>
				</Space>
			</Row>
		);
	}
	if (auth.isAuthenticated) {
		return props.children;
	}
	if (auth.error) {
		return (
			<Row
				justify={'center'}
				style={{ height: '100vh', alignItems: 'center' }}
			>
				<Space
					size={'large'}
					direction="vertical"
					style={{ textAlign: 'center' }}
				>
					<Typography.Title level={2}>Authentication failed</Typography.Title>
					<Typography.Text>{auth.error.message}</Typography.Text>
				</Space>
			</Row>
		);
	}
	if (props.forceLogin === false) {
		return <Navigate to="/" />;
	}

	return (
		<Row
			justify={'center'}
			style={{ height: '100vh', alignItems: 'center' }}
		>
			<Space
				size={'large'}
				direction="vertical"
				style={{ textAlign: 'center' }}
			>
				<Spin size="large" />
				<Typography.Title level={2}>Redirecting to sign in...</Typography.Title>
			</Space>
		</Row>
	);
};
