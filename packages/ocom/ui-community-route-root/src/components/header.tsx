import { Button, theme } from 'antd';
import type React from 'react';
import { useAuth } from 'react-oidc-context';
import styles from './header.module.css';

export const Header: React.FC = () => {
	const auth = useAuth();
	const handleLogin = async () => {
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
		globalThis.location.href = `${import.meta.env['VITE_AAD_B2C_REDIRECT_URI']}`;
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
				Log In v6
			</Button>
		</div>
	);
};
