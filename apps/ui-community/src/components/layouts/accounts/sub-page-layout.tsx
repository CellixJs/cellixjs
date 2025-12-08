
// @ts-ignore [TS7]
import { Layout, theme } from 'antd';
import type React from "react";

const { Header, Content, Footer } = Layout;

interface SubPageLayoutProps {
    header: React.JSX.Element;
    fixedHeader?: boolean;
    children?: React.ReactNode;
}

export const SubPageLayout: React.FC<SubPageLayoutProps> = (props) => {
  const overFlow = props.fixedHeader ? 'scroll' : 'unset';
  const {
    token: {colorTextBase,  colorBgContainer }
  }=theme.useToken();
  return (
    <>
      <Header style={{ padding: 0, height: 'fit-content', backgroundColor:colorBgContainer, color:colorTextBase }} >
        
        {props.header}
      </Header>
      <div style={{ display: 'flex', flexDirection: 'column', flex: '1 auto', overflowY: overFlow, backgroundColor:colorBgContainer, color:colorTextBase }}>
        <Content style={{ margin: '24px 16px 0', minHeight: 'inherit' }}>
          <div className="" style={{ padding: 24, minHeight: '100%' }}>
            {props.children}
          </div>
        </Content>
        <Footer className="flex items-center mx-auto" style={{ height: '47px' }}>
          Owner Community
        </Footer>
      </div>
    </>
  );
};