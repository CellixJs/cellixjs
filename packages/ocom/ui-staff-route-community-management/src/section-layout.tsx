import { SectionLayout as SharedSectionLayout, type SectionLayoutProps } from '@ocom/ui-staff-shared';
import { TeamOutlined } from '@ant-design/icons';

export const SectionLayout: React.FC = () => {
const pageLayouts: SectionLayoutProps['pageLayouts'] = [
{
path: '/staff/community',
title: 'Community Management',
icon: <TeamOutlined />,
id: 'community',
},
];

return (
<SharedSectionLayout
title="Community Management"
description="Community management route package mounted under /staff/community."
pageLayouts={pageLayouts}
/>
);
};
