import { SectionLayout as SharedSectionLayout, type SectionLayoutProps } from '@ocom/ui-staff-shared';
import { TeamOutlined } from '@ant-design/icons';

export const SectionLayout: React.FC = () => {
const pageLayouts: SectionLayoutProps['pageLayouts'] = [
{
path: '/staff/users',
title: 'User Management',
icon: <TeamOutlined />,
id: 'users',
},
];

return (
<SharedSectionLayout
title="User Management"
description="User management route package mounted under /staff/users."
pageLayouts={pageLayouts}
/>
);
};
