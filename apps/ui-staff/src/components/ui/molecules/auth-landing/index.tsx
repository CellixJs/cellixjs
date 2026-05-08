import { useAuth } from 'react-oidc-context';
import { Navigate } from 'react-router-dom';
import { extractRoles, staffRouteRoles } from '@ocom/ui-staff-shared';

export const AuthLanding: React.FC = () => {
	const auth = useAuth();

	// Extract roles from the OIDC profile
	const roles = extractRoles((auth?.user?.profile as Record<string, unknown>) ?? undefined);

	// Find the first accessible route based on user roles
	// Order: tech > finance > community-management, user-management
	const routePaths = ['/staff/tech', '/staff/finance', '/staff/community-management', '/staff/user-management'];

	let targetRoute = '/unauthorized';

	if (roles && roles.length > 0) {
		for (const route of routePaths) {
			const requiredRoles = staffRouteRoles[route as keyof typeof staffRouteRoles];
			if (requiredRoles && requiredRoles.some((role) => roles.includes(role))) {
				targetRoute = route;
				break;
			}
		}
	}

	return <Navigate to={targetRoute} />;
};
