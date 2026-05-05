export const StaffAppRoles = {
	TechAdmin: 'Staff.TechAdmin',
	Finance: 'Staff.Finance',
	ServiceLineOwner: 'Staff.ServiceLineOwner',
	CaseManager: 'Staff.CaseManager',
} as const;

export type StaffAppRole = (typeof StaffAppRoles)[keyof typeof StaffAppRoles];

/**
 * Centralized mapping of top-level staff routes to the Entra app roles required to access them.
 * A user must hold at least one of the listed roles to be admitted to the route.
 */
export const staffRouteRoles = {
	'/staff/community': [StaffAppRoles.CaseManager, StaffAppRoles.ServiceLineOwner],
	'/staff/users': [StaffAppRoles.CaseManager, StaffAppRoles.ServiceLineOwner],
	'/staff/finance': [StaffAppRoles.Finance],
	'/staff/tech': [StaffAppRoles.TechAdmin],
} satisfies Record<string, readonly StaffAppRole[]>;

/**
 * Extracts role strings from an OIDC token raw profile.
 * Checks common claim names used by Entra and other providers.
 */
export const extractRoles = (raw: Record<string, unknown> | undefined): string[] | undefined => {
	if (!raw) return undefined;
	const candidates: Array<string | string[] | undefined> = [
		// biome-ignore lint/complexity/useLiteralKeys: dynamic profile keys from OIDC token claims
		raw['roles'] as string | string[] | undefined,
		// biome-ignore lint/complexity/useLiteralKeys: dynamic profile keys from OIDC token claims
		raw['role'] as string | string[] | undefined,
		// biome-ignore lint/complexity/useLiteralKeys: dynamic profile keys from OIDC token claims
		raw['groups'] as string | string[] | undefined,
		// biome-ignore lint/complexity/useLiteralKeys: dynamic profile keys from OIDC token claims
		raw['app_roles'] as string | string[] | undefined,
		// biome-ignore lint/complexity/useLiteralKeys: dynamic profile keys from OIDC token claims
		(raw['realm_access'] as Record<string, unknown> | undefined)?.['roles'] as string[] | undefined,
	];
	const roles: string[] = [];
	for (const c of candidates) {
		if (Array.isArray(c)) {
			roles.push(...(c.filter((x) => typeof x === 'string') as string[]));
		} else if (typeof c === 'string') {
			roles.push(c);
		}
	}
	return roles.length ? Array.from(new Set(roles)) : undefined;
};
