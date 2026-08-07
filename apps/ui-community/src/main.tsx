import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { App as AntdApp } from 'antd';
import { OwnerCommunityProvider } from '@ocom/ui-community-shared';
import React, { useContext } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from 'react-oidc-context';
import { BrowserRouter } from 'react-router-dom';
import './index.less';
import '@ocom/ui-community-shared/theme/theme.css';
import App from './App.tsx';
import { oidcConfig } from './config/oidc-config.tsx';
import { ThemeContext, ThemeProvider } from './contexts/theme-context.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
	throw new Error('Root element #root not found');
}

const AppShell = () => {
	const { mode } = useContext(ThemeContext);

	return (
		<OwnerCommunityProvider mode={mode}>
			<AntdApp>
				<HelmetProvider>
					<BrowserRouter>
						<AuthProvider {...oidcConfig}>
							<App />
						</AuthProvider>
					</BrowserRouter>
				</HelmetProvider>
			</AntdApp>
		</OwnerCommunityProvider>
	);
};

createRoot(rootElement).render(
	<React.StrictMode>
		<ThemeProvider>
			<AppShell />
		</ThemeProvider>
	</React.StrictMode>,
);
