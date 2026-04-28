import { createElement, type FC } from 'react';
import { SectionLayout } from './section-layout.tsx';
export { StaffRouteShell, type StaffRouteShellProps, StaffAuthContext, StaffAuthProvider, type StaffAuth } from './staff-route-shell.tsx';

export const Root: FC = () => createElement(SectionLayout);
