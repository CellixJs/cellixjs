import React, { createElement, type FC } from 'react';
import { SectionLayout } from './section-layout.tsx';

export { VerticalTabs } from '@ocom/ui-shared';
export { RequireRole, type RequireRoleProps } from './require-role.tsx';
export { SectionLayoutContainer } from './section-layout.container.tsx';
export { SectionLayout, type SectionLayoutProps } from './section-layout.tsx';
export { extractRoles, type StaffAppRole, StaffAppRoles, staffRouteRoles } from './staff-app-roles.ts';
export { type StaffAuth, StaffAuthContext, StaffAuthProvider, StaffRouteShell, type StaffRouteShellProps } from './staff-route-shell.tsx';
export { SubPageLayout } from './sub-page-layout.tsx';

export interface PlaceholderProps {
	sectionName: string;
	description?: string;
	expectedRoles?: string[];
	explicitRoles?: string[];
}

import type { StaffAuth } from './staff-route-shell.tsx';
import { StaffAuthContext } from './staff-route-shell.tsx';

export const PlaceholderPage: React.FC<PlaceholderProps> = ({ sectionName, description, expectedRoles, explicitRoles }) => {
	const auth = React.useContext(StaffAuthContext);

	const resolvedPermissions = React.useMemo(() => {
		if (explicitRoles && explicitRoles.length > 0) return explicitRoles;
		const perms = auth?.permissions;
		if (perms) {
			return Object.entries(perms)
				.filter(([, isEnabled]) => isEnabled === true)
				.map(([permKey]) => permKey);
		}
		// Fall back to raw roles from auth context (e.g., JWT roles before backend permissions are resolved)
		if (auth?.roles && auth.roles.length > 0) return auth.roles;
		return [];
	}, [auth, explicitRoles]);

	const identitySummary = React.useMemo<{ displayName: string; identifier: string | undefined } | null>(() => {
		if (!auth) return null;
		const a = auth as StaffAuth;
		type RawProfile = { roles?: string[] | unknown; role?: string | unknown; name?: string; displayName?: string; preferred_username?: string; username?: string; email?: string };
		const raw = a.raw as RawProfile | undefined;
		const displayName = (a.name ?? raw?.name ?? raw?.displayName ?? raw?.preferred_username ?? raw?.username ?? raw?.email ?? 'Staff User') as string;
		const identifierRaw = (a.username ?? a.email ?? raw?.email ?? raw?.username ?? undefined) as string | undefined;
		// Only expose an identifier when it is meaningfully different from the display name
		const identifier = identifierRaw && identifierRaw !== displayName ? identifierRaw : undefined;
		return {
			displayName,
			identifier,
		};
	}, [auth]);

	return (
		<div style={{ padding: 24 }}>
			<div style={{ marginBottom: 12, fontWeight: 700, fontSize: 18 }}>{sectionName}</div>
			<div style={{ marginBottom: 8, color: '#888' }}>{description}</div>

			<div style={{ padding: 12, borderRadius: 6, background: '#fff', boxShadow: '0 0 4px rgba(0,0,0,0.04)' }}>
				<div style={{ marginBottom: 8, color: '#333', fontWeight: 700 }}>Placeholder</div>
				<div style={{ marginBottom: 8, color: '#666' }}>This page is a visible placeholder for the section.</div>

				{identitySummary ? (
					<div style={{ marginTop: 8 }}>
						<div style={{ fontWeight: 600 }}>Identity</div>
						<div style={{ color: '#444' }}>{identitySummary.displayName}</div>
						{identitySummary.identifier ? <div style={{ color: '#666' }}>{identitySummary.identifier}</div> : null}
					</div>
				) : (
					<div style={{ color: '#666', marginTop: 8 }}>No authenticated identity available</div>
				)}

				<div style={{ marginTop: 12 }}>
					<div style={{ fontWeight: 600 }}>Resolved Permissions</div>
					{resolvedPermissions.length > 0 ? (
						<ul>
							{resolvedPermissions.map((permission) => (
								<li key={permission}>{permission}</li>
							))}
						</ul>
					) : (
						<div style={{ color: '#666' }}>(none)</div>
					)}
				</div>

				{expectedRoles && expectedRoles.length > 0 && (
					<div style={{ marginTop: 12 }}>
						<div style={{ fontWeight: 600 }}>Expected roles for this section</div>
						<ul>
							{expectedRoles.map((r) => (
								<li key={r}>{r}</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
};

export const Root: FC = () =>
	createElement(SectionLayout, {
		pageLayouts: [],
	});
