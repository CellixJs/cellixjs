import type { FC } from 'react';

export const SectionLayout: FC = () => {
	return (
		<div style={{ display: 'flex', padding: 20 }}>
			<nav style={{ width: 220, marginRight: 20 }}>
				<ul style={{ listStyle: 'none', padding: 0 }}>
					<li style={{ marginBottom: 8 }}><a href="/staff/community">Community Management</a></li>
					<li style={{ marginBottom: 8 }}><a href="/staff/users">User Management</a></li>
					<li style={{ marginBottom: 8 }}><a href="/staff/finance">Finance</a></li>
					<li style={{ marginBottom: 8 }}><a href="/staff/tech">Tech Admin</a></li>
				</ul>
			</nav>
			<main style={{ flex: 1 }}>
				<div>Welcome to Staff area. Select a section from the menu.</div>
			</main>
		</div>
	);
};
