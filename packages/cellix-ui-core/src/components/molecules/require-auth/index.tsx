import {Row, Space, Spin, Typography } from 'antd';
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

  // automatically sign-in
  useEffect(() => {
    if (
      !hasAuthParams() &&
      props.forceLogin === true &&
      !auth.isAuthenticated &&
      !auth.activeNavigator &&
      !auth.isLoading &&
      !auth.error
    ) {
      window.sessionStorage.setItem('redirectTo', `${location.pathname}${location.search}`);

      auth.signinRedirect();
    }
  }, [
    auth.isAuthenticated,
    auth.activeNavigator,
    auth.isLoading,
    auth.signinRedirect,
    auth.error,
    location.pathname,
    location.search,
    props.forceLogin,
  ]);

  const redirectUser = () => {
    auth.signinRedirect();
  };

  if (auth.isLoading || auth.activeNavigator) {
    //still loading
    return (
      <Row justify={'center'} style={{ height: '100vh', alignItems: 'center' }}>
        <Space size={'large'} direction="vertical" style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <Typography.Title level={2}>Please wait...</Typography.Title>
        </Space>
      </Row>
    );
  }
  if (auth.isAuthenticated) {
    return props.children;
  } else if (auth.error) {
    return <Navigate to="/" />;
  } else {
    redirectUser();
    return;
  }
};
