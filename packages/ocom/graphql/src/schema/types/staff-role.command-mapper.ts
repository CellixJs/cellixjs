import type { StaffRoleCreateCommand } from '../../../../application-services/src/contexts/user/staff-role/create.js';
import type { StaffRoleUpdateCommand } from '../../../../application-services/src/contexts/user/staff-role/update.js';
import type {
	StaffRoleCommandPermissions,
	StaffRoleCommandCommunityPermissions,
	StaffRoleCommandFinancePermissions,
	StaffRoleCommandRolePermissions,
	StaffRoleCommandTechAdminPermissions,
	StaffRoleCommandUserPermissions,
} from '../../../../application-services/src/contexts/user/staff-role/apply-permissions.js';
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

export function buildStaffRoleCreateCommand(input: MutationStaffRoleCreateArgs['input'], roles: string[]): StaffRoleCreateCommand | { errorMessage: string } {
	const requestedEnterpriseAppRole = input?.enterpriseAppRole ?? '';
	const allowedEnterpriseAppRoles = getAllowedEnterpriseAppRoles(roles);
	if (requestedEnterpriseAppRole && !allowedEnterpriseAppRoles.includes(requestedEnterpriseAppRole)) {
		return { errorMessage: `You do not have permission to create a role for enterprise app role type: ${requestedEnterpriseAppRole}` };
	}
	const permissions = mapPermissionsInput(input?.permissions);
	return {
		roleName: input?.roleName ?? '',
		...(input?.enterpriseAppRole ? { enterpriseAppRole: input.enterpriseAppRole } : {}),
		...(permissions ? { permissions } : {}),
	};
}

export function buildStaffRoleUpdateCommand(input: NonNullable<MutationStaffRoleUpdateArgs['input']>): StaffRoleUpdateCommand {
	const permissions = mapPermissionsInput(input.permissions);
	return {
		roleId: input.id,
		roleName: input.roleName,
		...(input.enterpriseAppRole ? { enterpriseAppRole: input.enterpriseAppRole } : {}),
		...(permissions ? { permissions } : {}),
	};
}