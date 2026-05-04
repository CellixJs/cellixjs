import { createElement, type FC } from 'react';
import { SectionLayout } from './section-layout.tsx';

export { type StaffAuth, StaffAuthContext, StaffAuthProvider, StaffRouteShell, type StaffRouteShellProps } from './staff-route-shell.tsx';

export const Root: FC = () => createElement(SectionLayout);
