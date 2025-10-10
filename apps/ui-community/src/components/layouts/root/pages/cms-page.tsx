import { Typography } from 'antd';

const { Text } = Typography;

export const CmsPage: React.FC = () => {

  return (
    <div style={{margin:0, padding:0, minHeight:'calc(100vh - 50px)'}}>
        <Text>Pretend this is a CMS page</Text>
        <br />
        <Text>With some additional content</Text>
    </div>
  );
}