import { type FC, type ReactNode, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { extractRoles } from './staff-app-roles.ts';
import type { StaffAuth } from './staff-route-shell.tsx';
import { StaffAuthContext } from './staff-route-shell.tsx';

export interface RequireRoleProps {
	/** At least one of these roles must be present in the authenticated user's token. */
	roles: readonly string[];
	/** When provided, gate by this backend permission flag instead of JWT roles. */
	permKey?: keyof NonNullable<StaffAuth['permissions']>;
	children: ReactNode;
}

/**
 * Guards a UI branch behind one or more Entra app roles, or a backend permission flag.
 *
 * When `permKey` is supplied and the `StaffAuthContext` already has a `permissions` object
 * (populated from the backend), the permission flag takes precedence over JWT role strings.
 * Falls back to the JWT role check when permissions are not yet available.
 */
export const RequireRole: FC<RequireRoleProps> = ({ roles, permKey, children }) => {
	const auth = useContext(StaffAuthContext);
	const perms = auth?.permissions;

	// Prefer backend permission flag when it has been fetched
	if (permKey !== undefined && perms !== undefined) {
		const isAuthorized = perms[permKey] === true;
		if (!isAuthorized) {
			return (
				<Navigate
					to="/unauthorized"
					replace
				/>
			);
		}
		return <>{children}</>;
	}

	// Fallback: check JWT roles
	const userRoles = auth?.roles ?? extractRoles(auth?.raw);
	const isAuthorized = roles.length === 0 || (userRoles !== undefined && roles.some((r) => userRoles.includes(r)));

	if (!isAuthorized) {
		return (
			<Navigate
				to="/unauthorized"
				replace
			/>
		);
	}

	return <>{children}</>;
};
