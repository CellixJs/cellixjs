import { createContext, type FC, type ReactNode, useContext } from 'react';
import { extractRoles, staffRouteRoles } from './staff-app-roles.ts';

export interface StaffRouteShellProps {
	title: string;
	description: string;
}

export type StaffAuth = {
	name?: string;
	username?: string;
	email?: string;
	roles?: string[];
	raw?: Record<string, unknown>;
	onLogout?: () => Promise<void> | void;
	permissions?: {
		canManageCommunities?: boolean;
		canManageUser?: boolean;
		canManageFinance?: boolean;
		canManageTechAdmin?: boolean;
	};
};

export const StaffAuthContext = createContext<StaffAuth | undefined>(undefined);

export const StaffAuthProvider: FC<{ value: StaffAuth; children?: ReactNode }> = ({ value, children }) => <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>;

const allNavLinks = [
	{ label: 'Community Management', href: '/staff/community', roles: staffRouteRoles['/staff/community'], permKey: 'canManageCommunities' as const },
	{ label: 'User Management', href: '/staff/users', roles: staffRouteRoles['/staff/users'], permKey: 'canManageUser' as const },
	{ label: 'Finance', href: '/staff/finance', roles: staffRouteRoles['/staff/finance'], permKey: 'canManageFinance' as const },
	{ label: 'Tech Admin', href: '/staff/tech', roles: staffRouteRoles['/staff/tech'], permKey: 'canManageTechAdmin' as const },
];

export const StaffRouteShell: FC<StaffRouteShellProps> = ({ title, description }) => {
	const auth = useContext(StaffAuthContext);
	const raw = auth?.raw as Record<string, unknown> | undefined;
	// biome-ignore lint/complexity/useLiteralKeys: dynamic OIDC profile claim names
	const fallbackName = raw ? ((raw['name'] as string | undefined) ?? (raw['preferred_username'] as string | undefined) ?? (raw['email'] as string | undefined)) : undefined;
	const name = auth?.name ?? auth?.username ?? auth?.email ?? fallbackName;
	const roles = auth?.roles ?? extractRoles(auth?.raw);
	const perms = auth?.permissions;

	const isNavLinkVisible = (link: { roles: readonly string[]; permKey?: keyof NonNullable<StaffAuth['permissions']> }): boolean => {
		if (link.roles.length === 0) return true;
		// Prefer backend permission flags when available
		if (perms && link.permKey !== undefined) {
			return perms[link.permKey] === true;
		}
		return roles !== undefined && link.roles.some((r) => roles.includes(r));
	};

	const navLinks = allNavLinks.filter((link) => isNavLinkVisible(link));

	return (
		<div style={{ minHeight: '100%', background: '#f5f7fb', padding: '24px' }}>
			<div style={{ maxWidth: 980, margin: '0 auto', background: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
				<header style={{ padding: '20px 24px', borderBottom: '1px solid #eef2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					<div>
						<div style={{ fontSize: 22, fontWeight: 700 }}>{title}</div>
						<div style={{ marginTop: 8, color: '#4b5563' }}>{description}</div>
					</div>
					<div style={{ textAlign: 'right' }}>
						<div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>Placeholder</div>
						{name ? (
							<div style={{ marginTop: 8, fontSize: 13, color: '#111827' }}>
								<div style={{ fontWeight: 700 }}>Signed in as</div>
								<div>{name}</div>
								{auth?.onLogout ? (
									<button
										type="button"
										onClick={() => {
											void auth.onLogout?.();
										}}
										style={{
											marginTop: 10,
											padding: '6px 12px',
											borderRadius: 6,
											border: '1px solid #d1d5db',
											background: '#ffffff',
											color: '#111827',
											cursor: 'pointer',
											fontWeight: 600,
										}}
									>
										Log out
									</button>
								) : null}
							</div>
						) : (
							<div style={{ marginTop: 8, fontSize: 13, color: '#9ca3af' }}>Not signed in</div>
						)}
					</div>
				</header>
				<div style={{ display: 'flex', gap: 24, padding: 24 }}>
					<nav style={{ width: 260 }}>
						<div style={{ marginBottom: 10, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280' }}>Staff Sections</div>
						<div style={{ display: 'grid', gap: 10 }}>
							{navLinks.map((link) => (
								<a
									key={link.href}
									href={link.href}
									style={{
										display: 'block',
										padding: '10px 12px',
										borderRadius: 8,
										border: '1px solid #d1d5db',
										color: '#111827',
										textDecoration: 'none',
										fontWeight: 600,
										background: '#ffffff',
									}}
								>
									{link.label}
								</a>
							))}
						</div>
					</nav>
					<main style={{ flex: 1 }}>
						<div style={{ padding: 16, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
							{description}
							<div style={{ marginTop: 12, fontSize: 13, color: '#374151' }}>
								<div style={{ fontWeight: 700, marginBottom: 6 }}>Identity</div>
								{name ? <div>{name}</div> : <div style={{ color: '#9ca3af' }}>No authenticated identity available</div>}
							</div>
							<div style={{ marginTop: 12, fontSize: 13, color: '#374151' }}>
								<div style={{ fontWeight: 700, marginBottom: 6 }}>Resolved Roles</div>
								{roles?.length ? (
									<ul style={{ margin: 0, paddingLeft: 18 }}>
										{roles.map((r) => (
											<li key={r}>{r}</li>
										))}
									</ul>
								) : (
									<div style={{ color: '#9ca3af' }}>No roles available</div>
								)}
							</div>
						</div>
					</main>
				</div>
			</div>
		</div>
	);
};
