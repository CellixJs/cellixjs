import type { StaffPortalBusinessRole } from '../../../shared/abilities/staff-portal-session.ts';

export interface StaffE2ENotes {
	currentPath: string;
	/** Business role of the mock OIDC staff user the scenario authenticated as. */
	businessRole: StaffPortalBusinessRole;
}
