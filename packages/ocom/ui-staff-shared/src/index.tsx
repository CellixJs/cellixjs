import { createElement, type FC } from 'react';
import { SectionLayout } from './section-layout.tsx';

export { RequireRole, type RequireRoleProps } from './require-role.tsx';
export { extractRoles, type StaffAppRole, StaffAppRoles, staffRouteRoles } from './staff-app-roles.ts';
export { type StaffAuth, StaffAuthContext, StaffAuthProvider, StaffRouteShell, type StaffRouteShellProps } from './staff-route-shell.tsx';

export const Root: FC = () => createElement(SectionLayout);
