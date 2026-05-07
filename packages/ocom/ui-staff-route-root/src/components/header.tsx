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
		} catch (_err) {
			// swallow and fall back below
		}

		// fall back to direct navigation if the OIDC helper is unavailable or fails
		// biome-ignore lint:useLiteralKeys
		globalThis.location.href = `${import.meta.env['VITE_APP_UI_STAFF_AAD_REDIRECT_URI']}`;
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
