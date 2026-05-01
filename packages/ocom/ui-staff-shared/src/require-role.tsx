import { type FC, type ReactNode, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { extractRoles } from './staff-app-roles.ts';
import { StaffAuthContext } from './staff-route-shell.tsx';

export interface RequireRoleProps {
	/** At least one of these roles must be present in the authenticated user's token. */
	roles: readonly string[];
	children: ReactNode;
}

/**
 * Guards a UI branch behind one or more Entra app roles.
 *
 * Reads the authenticated identity from {@link StaffAuthContext} and redirects
 * to `/unauthorized` when the user lacks every required role.
 * Must be rendered inside a {@link StaffAuthProvider} and a React Router context.
 */
export const RequireRole: FC<RequireRoleProps> = ({ roles, children }) => {
	const auth = useContext(StaffAuthContext);
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
