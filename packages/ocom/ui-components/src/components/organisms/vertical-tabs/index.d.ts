import React from 'react';

interface RouteDefinition {
    id: string;
    link: string;
    path: string;
    title: string;
    icon: React.ReactNode;
    element: React.ReactNode;
}
interface VerticalTabsProps {
    pages: RouteDefinition[];
}
export declare const VerticalTabs: React.FC<VerticalTabsProps>;
export {};
