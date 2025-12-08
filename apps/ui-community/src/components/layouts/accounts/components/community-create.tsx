import React from 'react';
// @ts-ignore [TS7]
import { Button, Form, Input, Typography, theme } from 'antd';
import { Helmet } from '@dr.pogodin/react-helmet';
import type { CommunityCreateInput } from '../../../../generated.tsx';

export interface CommunityCreateProps {
    onSave: (values: CommunityCreateInput) => void;
}

export const CommunityCreate: React.FC<CommunityCreateProps> = (props) => {
  const [form] = Form.useForm();
  const [formLoading, setFormLoading] = React.useState(false);
  const {
    token: { colorTextBase, colorBgContainer }
  } = theme.useToken();
  const { Title } = Typography;
  return (
    <>
      <div
        className={'w-full p-5 mx-auto my-5 shadow-lg rounded-lg border border-1'}
        style={{
          backgroundColor: colorBgContainer,
          color: colorTextBase
        }}
      >
        <Helmet>
        <title>Create A Community</title>
      </Helmet>
        <Title level={3}>Creating your Community</Title>
        <p>
          Getting started with your community is only a few clicks away.
          <br />
          Once you create it here you'll see it in the list of communities you have access to. <br />
          You will have access to both the member side and the admin side of your community. <br />
          Start by creating a name for your community, you can always change it later, you may want to make the name
          descriptive to avoid confusion with other communities with the same or similar names.
        </p>
      </div>
      <Form
        layout="vertical"
        form={form}
        onFinish={(values) => {
          setFormLoading(true);
          props.onSave(values);
          setFormLoading(false);
        }}
      >
        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please input Name!' }]}>
          <Input placeholder="Name" />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={formLoading}>
          Create Community
        </Button>
      </Form>
    </>
  );
};
