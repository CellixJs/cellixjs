import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { ConfigProvider } from 'antd';
import React, { useContext } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from "react-oidc-context";
import { BrowserRouter } from 'react-router-dom'
import './index.less';
import App from './App.tsx';
import { oidcConfig } from './config/oidc-config.tsx';
import { ThemeContext, ThemeProvider } from './contexts/theme-context.tsx';

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found')
}

const ConfigProviderWrapper = () => {
  const { currentTokens } = useContext(ThemeContext);

  return (
    <ConfigProvider
      theme={{
        token: {
          ...currentTokens?.token,
          colorBgBase: currentTokens?.hardCodedTokens.backgroundColor as string,
          colorPrimaryText: currentTokens?.hardCodedTokens.textColor as string
        }
      }}
    >
      <ThemeProvider>
        <HelmetProvider>
          <BrowserRouter>
            <AuthProvider {...oidcConfig}>
                <App />
            </AuthProvider>
          </BrowserRouter>
        </HelmetProvider>
      </ThemeProvider>
    </ConfigProvider>
  );
}


createRoot(rootElement).render(
  <React.StrictMode>
    <ConfigProviderWrapper />
  </React.StrictMode>,
)
