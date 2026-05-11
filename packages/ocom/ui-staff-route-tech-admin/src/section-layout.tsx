import { SectionLayout as SharedSectionLayout, type SectionLayoutProps } from '@ocom/ui-staff-shared';
import { ToolOutlined } from '@ant-design/icons';
import type React from 'react';
export const SectionLayout: React.FC = () => {
const pageLayouts: SectionLayoutProps['pageLayouts'] = [
{
path: '/staff/tech',
title: 'Tech Admin',
icon: <ToolOutlined />,
id: 'tech',
},
];

return (
<SharedSectionLayout
title="Tech Admin"
description="Tech admin route package mounted under /staff/tech."
pageLayouts={pageLayouts}
/>
);
};
