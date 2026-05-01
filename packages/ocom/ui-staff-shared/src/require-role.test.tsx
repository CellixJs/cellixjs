import type * as React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RequireRole } from './require-role.tsx';
import { StaffAuthProvider } from './staff-route-shell.tsx';

const Protected: React.FC = () => <div>protected content</div>;

describe('RequireRole', () => {
	it('renders children when user has a required role', () => {
		const identity = { raw: { roles: ['Staff.TechAdmin'] } };
		const html = renderToString(
			<MemoryRouter>
				<StaffAuthProvider value={identity}>
					<RequireRole roles={['Staff.TechAdmin']}>
						<Protected />
					</RequireRole>
				</StaffAuthProvider>
			</MemoryRouter>,
		);
		expect(html).toContain('protected content');
	});

	it('renders children when user holds one of multiple required roles', () => {
		const identity = { raw: { roles: ['Staff.CaseManager'] } };
		const html = renderToString(
			<MemoryRouter>
				<StaffAuthProvider value={identity}>
					<RequireRole roles={['Staff.CaseManager', 'Staff.ServiceLineOwner']}>
						<Protected />
					</RequireRole>
				</StaffAuthProvider>
			</MemoryRouter>,
		);
		expect(html).toContain('protected content');
	});

	it('redirects to /unauthorized when user lacks required role', () => {
		const identity = { raw: { roles: ['Staff.Finance'] } };
		const html = renderToString(
			<MemoryRouter initialEntries={['/staff/tech']}>
				<StaffAuthProvider value={identity}>
					<RequireRole roles={['Staff.TechAdmin']}>
						<Protected />
					</RequireRole>
				</StaffAuthProvider>
			</MemoryRouter>,
		);
		expect(html).not.toContain('protected content');
	});

	it('redirects when user has no roles at all', () => {
		const identity = { raw: {} };
		const html = renderToString(
			<MemoryRouter>
				<StaffAuthProvider value={identity}>
					<RequireRole roles={['Staff.TechAdmin']}>
						<Protected />
					</RequireRole>
				</StaffAuthProvider>
			</MemoryRouter>,
		);
		expect(html).not.toContain('protected content');
	});

	it('renders children when roles array is empty (no restriction)', () => {
		const identity = { raw: {} };
		const html = renderToString(
			<MemoryRouter>
				<StaffAuthProvider value={identity}>
					<RequireRole roles={[]}>
						<Protected />
					</RequireRole>
				</StaffAuthProvider>
			</MemoryRouter>,
		);
		expect(html).toContain('protected content');
	});
});
