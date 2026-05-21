import { Button, theme } from 'antd';
import type React from 'react';
import { useAuth } from 'react-oidc-context';
import styles from './header.module.css';

export const Header: React.FC = () => {
	const auth = useAuth();
	const handleLogin = async () => {
		// If react-oidc-context is available, prefer its signinRedirect flow so
		// the OIDC library manages state and returns to the app correctly.
		try {
			if (auth?.signinRedirect) {
				await auth.signinRedirect();
				return;
			}
		} catch (err) {
			console.error('OIDC signinRedirect failed, falling back to direct navigation', err);
		}

		// fall back to direct navigation if the OIDC helper is unavailable or fails
		globalThis.location.href = `${(import.meta as { env?: ImportMetaEnv }).env?.VITE_APP_UI_STAFF_AAD_REDIRECT_URI ?? ''}`;
	};

	const {
		token: { colorBgContainer },
	} = theme.useToken();

	return (
		<div
			className={`${styles['top-bar']} flex gap-2`}
			style={{ backgroundColor: colorBgContainer }}
		>
			<Button
				type="primary"
				onClick={handleLogin}
			>
				Sign In
			</Button>
		</div>
	);
};
