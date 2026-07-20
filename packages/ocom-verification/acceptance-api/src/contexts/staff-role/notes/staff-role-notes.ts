/** Input details used when creating a staff role through the API. */
export interface StaffRoleDetails {
	roleName: string;
	enterpriseAppRole?: string | undefined;
	permissions?: Record<string, boolean> | undefined;
}

/** Scenario-local staff-role state shared between tasks and questions via actor notes. */
export interface StaffRoleNotes {
	lastStaffRoleStatus: string;
	lastStaffRoleId: string;
	lastStaffRoleName: string;
	lastStaffRoleError: string;
	listedStaffRoleNames: string[];
	viewedStaffRoleId: string;
	viewedStaffRoleName: string;
	viewedStaffRoleEnterpriseAppRole: string;
	baselineStaffRoleCount: number;
}
