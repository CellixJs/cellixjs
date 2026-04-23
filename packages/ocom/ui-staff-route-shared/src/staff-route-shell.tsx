import type { FC } from 'react';

export interface StaffRouteShellProps {
	title: string;
	description: string;
}

const navLinks = [
	{ label: 'Community Management', href: '/staff/community' },
	{ label: 'User Management', href: '/staff/users' },
	{ label: 'Finance', href: '/staff/finance' },
	{ label: 'Tech Admin', href: '/staff/tech' },
];

export const StaffRouteShell: FC<StaffRouteShellProps> = ({ title, description }) => {
	return (
		<div style={{ minHeight: '100%', background: '#f5f7fb', padding: '24px' }}>
			<div style={{ maxWidth: 980, margin: '0 auto', background: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
				<header style={{ padding: '20px 24px', borderBottom: '1px solid #eef2f7' }}>
					<div style={{ fontSize: 22, fontWeight: 700 }}>{title}</div>
					<div style={{ marginTop: 8, color: '#4b5563' }}>{description}</div>
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
						</div>
					</main>
				</div>
			</div>
		</div>
	);
};
