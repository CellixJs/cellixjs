import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { App as AntdApp, ConfigProvider } from 'antd';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from 'react-oidc-context';
import { BrowserRouter } from 'react-router-dom';
import './index.less';
import App from './App.tsx';
import { oidcConfig } from './config/oidc-config.tsx';
import { ThemeProvider } from './contexts/theme-context.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
	throw new Error('Root element #root not found');
}

const ConfigProviderWrapper = () => {
	return (
		<ConfigProvider>
			<AntdApp>
				<HelmetProvider>
					<BrowserRouter>
						<AuthProvider {...oidcConfig}>
							<App />
						</AuthProvider>
						</BrowserRouter>
					</HelmetProvider>
				</AntdApp>
			</ConfigProvider>
	);
};

createRoot(rootElement).render(
	<React.StrictMode>
		<ThemeProvider>
			<ConfigProviderWrapper />
		</ThemeProvider>
	</React.StrictMode>,
);
