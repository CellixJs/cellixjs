import React, { createElement, type FC } from 'react';
import { SectionLayout } from './section-layout.tsx';

export { StaffRouteShell, type StaffRouteShellProps, StaffAuthContext, StaffAuthProvider, type StaffAuth } from './staff-route-shell.tsx';
export { SectionLayout, type SectionLayoutProps } from './section-layout.tsx';
export { SubPageLayout } from './sub-page-layout.tsx';
export { VerticalTabs } from '@ocom/ui-shared';

export interface PlaceholderProps {
	sectionName: string;
	description?: string;
	expectedRoles?: string[];
	explicitRoles?: string[];
}

import { StaffAuthContext } from './staff-route-shell.tsx';
import type { StaffAuth } from './staff-route-shell.tsx';

export const PlaceholderPage: React.FC<PlaceholderProps> = ({ sectionName, description, expectedRoles, explicitRoles }) => {
	const auth = React.useContext(StaffAuthContext);

	const resolvedRoles = React.useMemo(() => {
		if (explicitRoles && explicitRoles.length > 0) return explicitRoles;
		if (auth) {
			const a = auth as StaffAuth;
			if (Array.isArray(a.roles) && a.roles.length > 0) return a.roles as string[];
			type RawProfile = { roles?: unknown; role?: unknown };
			const raw = a.raw as RawProfile | undefined;
			if (raw) {
				const maybe = raw.roles ?? raw.role ?? undefined;
				if (Array.isArray(maybe)) return maybe as string[];
				if (typeof maybe === 'string') return [maybe];
			}
		}
		return [];
	}, [auth, explicitRoles]);

	const identitySummary = React.useMemo<{ displayName: string; identifier: string | undefined } | null>(() => {
		if (!auth) return null;
		const a = auth as StaffAuth;
		type RawProfile = { roles?: string[] | unknown; role?: string | unknown; name?: string; displayName?: string; preferred_username?: string; username?: string; email?: string };
		const raw = a.raw as RawProfile | undefined;
		return {
			displayName: a.name ?? raw?.name ?? raw?.displayName ?? raw?.preferred_username ?? raw?.username ?? raw?.email ?? 'Staff User',
			identifier: a.username ?? a.email ?? raw?.email ?? raw?.username ?? undefined,
		};
	}, [auth]);

	return (
		<div style={{ padding: 24 }}>
			<div style={{ marginBottom: 12, fontWeight: 700, fontSize: 18 }}>{sectionName}</div>
			<div style={{ marginBottom: 8, color: '#888' }}>{description}</div>

			<div style={{ padding: 12, border: '1px dashed #ccc', borderRadius: 6, background: '#fafafa' }}>
				<div style={{ marginBottom: 8, color: '#c00', fontWeight: 700 }}>Placeholder — proof surface</div>
				<div style={{ marginBottom: 8 }}>This page is a visible placeholder for the section.</div>

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
					<div style={{ fontWeight: 600 }}>Resolved Roles</div>
					{resolvedRoles && resolvedRoles.length > 0 ? (
						<ul>
							{resolvedRoles.map((r) => (
								<li key={r}>{r}</li>
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

