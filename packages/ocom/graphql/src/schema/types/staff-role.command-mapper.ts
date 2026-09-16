import type {
	StaffRoleCommandCommunityPermissions,
	StaffRoleCommandFinancePermissions,
	StaffRoleCommandPermissions,
	StaffRoleCommandRolePermissions,
	StaffRoleCommandTechAdminPermissions,
	StaffRoleCommandUserPermissions,
} from '../../../../application-services/src/contexts/user/staff-role/apply-permissions.js';
import type { StaffRoleCreateCommand } from '../../../../application-services/src/contexts/user/staff-role/create.js';
import type { StaffRoleUpdateCommand } from '../../../../application-services/src/contexts/user/staff-role/update.js';
import type { MutationStaffRoleCreateArgs, MutationStaffRoleUpdateArgs } from '../builder/generated.ts';

const EnterpriseAppRoleNames = {
	CaseManager: 'Staff.CaseManager',
	ServiceLineOwner: 'Staff.ServiceLineOwner',
	Finance: 'Staff.Finance',
	TechAdmin: 'Staff.TechAdmin',
} as const;

type StaffRolePermissionsInput = NonNullable<NonNullable<MutationStaffRoleCreateArgs['input']>['permissions']>;

function mapPermissionsInput(permissions: StaffRolePermissionsInput | null | undefined): StaffRoleCommandPermissions | undefined {
	if (!permissions) return undefined;
	const mapped: StaffRoleCommandPermissions = {};
	if (permissions.communityPermissions) mapped.community = permissions.communityPermissions as StaffRoleCommandCommunityPermissions;
	if (permissions.userPermissions) mapped.user = permissions.userPermissions as StaffRoleCommandUserPermissions;
	if (permissions.staffRolePermissions) mapped.staffRole = permissions.staffRolePermissions as StaffRoleCommandRolePermissions;
	if (permissions.financePermissions) mapped.finance = permissions.financePermissions as StaffRoleCommandFinancePermissions;
	if (permissions.techAdminPermissions) mapped.techAdmin = permissions.techAdminPermissions as StaffRoleCommandTechAdminPermissions;
	return mapped;
}

function getAllowedEnterpriseAppRoles(entraRoles: string[]): string[] {
	if (entraRoles.includes(EnterpriseAppRoleNames.TechAdmin)) {
		return Object.values(EnterpriseAppRoleNames);
	}
	const allowed: string[] = [];
	if (entraRoles.includes(EnterpriseAppRoleNames.ServiceLineOwner)) {
		allowed.push(EnterpriseAppRoleNames.ServiceLineOwner, EnterpriseAppRoleNames.CaseManager);
	}
	if (entraRoles.includes(EnterpriseAppRoleNames.CaseManager) && !allowed.includes(EnterpriseAppRoleNames.CaseManager)) {
		allowed.push(EnterpriseAppRoleNames.CaseManager);
	}
	if (entraRoles.includes(EnterpriseAppRoleNames.Finance)) {
		allowed.push(EnterpriseAppRoleNames.Finance);
	}
	return allowed;
}

/**
 * Returns a permission error message when the actor's Entra roles do not allow them to
 * act on the requested enterprise app role, or `undefined` when the action is permitted.
 */
export function getEnterpriseAppRolePermissionError(requestedEnterpriseAppRole: string | null | undefined, roles: string[], action: 'create' | 'update' | 'assign'): string | undefined {
	if (!requestedEnterpriseAppRole) {
		return undefined;
	}
	if (getAllowedEnterpriseAppRoles(roles).includes(requestedEnterpriseAppRole)) {
		return undefined;
	}
	return `You do not have permission to ${action} a role for enterprise app role type: ${requestedEnterpriseAppRole}`;
}

export function buildStaffRoleCreateCommand(input: MutationStaffRoleCreateArgs['input'], roles: string[]): StaffRoleCreateCommand | { errorMessage: string } {
	const errorMessage = getEnterpriseAppRolePermissionError(input?.enterpriseAppRole, roles, 'create');
	if (errorMessage) {
		return { errorMessage };
	}
	const permissions = mapPermissionsInput(input?.permissions);
	return {
		roleName: input?.roleName ?? '',
		...(input?.enterpriseAppRole ? { enterpriseAppRole: input.enterpriseAppRole } : {}),
		...(permissions ? { permissions } : {}),
	};
}

export function buildStaffRoleUpdateCommand(input: NonNullable<MutationStaffRoleUpdateArgs['input']>, roles: string[], currentEnterpriseAppRole: string | null | undefined): StaffRoleUpdateCommand | { errorMessage: string } {
	// The role being edited must itself be within the actor's authority, otherwise a
	// low-privileged actor could rewrite a privileged role's permissions simply by
	// omitting enterpriseAppRole from the input.
	const currentRoleError = getEnterpriseAppRolePermissionError(currentEnterpriseAppRole, roles, 'update');
	if (currentRoleError) {
		return { errorMessage: currentRoleError };
	}
	const errorMessage = getEnterpriseAppRolePermissionError(input.enterpriseAppRole, roles, 'update');
	if (errorMessage) {
		return { errorMessage };
	}
	const permissions = mapPermissionsInput(input.permissions);
	return {
		roleId: input.id,
		roleName: input.roleName,
		...(input.enterpriseAppRole ? { enterpriseAppRole: input.enterpriseAppRole } : {}),
		...(permissions ? { permissions } : {}),
	};
}
