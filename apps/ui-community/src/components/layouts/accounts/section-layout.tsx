import { LoggedInUserContainer } from '@ocom/ui-components';
import { Layout, theme } from 'antd';
import { Outlet } from 'react-router-dom';

const { Header } = Layout;

export const SectionLayout: React.FC = () => {
  const {
    token: { colorBgContainer }
  } = theme.useToken();
  return (
    <Layout className="site-layout" style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: colorBgContainer
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            gap: '10px'
          }}
        >
          <LoggedInUserContainer autoLogin={true} />
        </div>
      </Header>

      <Layout>
        <Layout
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: '1 auto',
            overflowY: 'scroll',
            height: 'calc(100vh - 64px)'
          }}
        >
          <Outlet />
        </Layout>
      </Layout>
    </Layout>
  );
};
