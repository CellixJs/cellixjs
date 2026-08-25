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

/**
 * Read-only view of a persisted staff role's permission flags, used to tell
 * newly requested grants apart from flags the role already holds.
 */
interface CurrentStaffRolePermissions {
	readonly communityPermissions?: { readonly [flag: string]: unknown } | undefined;
	readonly userPermissions?: { readonly [flag: string]: unknown } | undefined;
	readonly staffRolePermissions?: { readonly [flag: string]: unknown } | undefined;
	readonly financePermissions?: { readonly [flag: string]: unknown } | undefined;
	readonly techAdminPermissions?: { readonly [flag: string]: unknown } | undefined;
}

const PERMISSION_FLAGS_BY_GROUP = {
	communityPermissions: ['canManageCommunities', 'canManageStaffRolesAndPermissions', 'canManageAllCommunities', 'canDeleteCommunities', 'canChangeCommunityOwner', 'canReIndexSearchCollections'],
	userPermissions: ['canManageUsers', 'canAssignStaffRoles', 'canViewStaffUsers'],
	staffRolePermissions: ['canViewRoles', 'canAddRole', 'canEditRole', 'canRemoveRole'],
	financePermissions: ['canManageFinance', 'canViewGLBatchSummaries', 'canViewFinanceConfigs', 'canCreateFinanceConfigs'],
	techAdminPermissions: ['canManageTechAdmin', 'canViewDatabaseExplorer', 'canViewBlobExplorer', 'canViewQueueDashboard', 'canSendQueueMessages'],
} as const;

// Flags each tier may confer, mirroring the domain's default role instances
// (see StaffRole.getNewDefault*Instance): granting a flag outside the caller's
// tier would let a lower-tier staff user mint capabilities - such as
// canManageTechAdmin or canManageAllCommunities - that their own enterprise
// app role never carries.
const CASE_MANAGER_GRANTABLE_FLAGS = ['canManageCommunities', 'canManageStaffRolesAndPermissions', 'canManageUsers', 'canAssignStaffRoles', 'canViewStaffUsers', 'canViewRoles'] as const;
const FINANCE_GRANTABLE_FLAGS = [
	'canManageStaffRolesAndPermissions',
	'canManageUsers',
	'canAssignStaffRoles',
	'canViewStaffUsers',
	'canViewRoles',
	'canAddRole',
	'canEditRole',
	'canRemoveRole',
	'canManageFinance',
	'canViewGLBatchSummaries',
	'canViewFinanceConfigs',
	'canCreateFinanceConfigs',
] as const;

function getGrantablePermissionFlags(entraRoles: string[]): ReadonlySet<string> {
	if (entraRoles.includes(EnterpriseAppRoleNames.TechAdmin)) {
		return new Set(Object.values(PERMISSION_FLAGS_BY_GROUP).flat());
	}
	const grantable = new Set<string>();
	if (entraRoles.includes(EnterpriseAppRoleNames.ServiceLineOwner) || entraRoles.includes(EnterpriseAppRoleNames.CaseManager)) {
		for (const flag of CASE_MANAGER_GRANTABLE_FLAGS) grantable.add(flag);
	}
	if (entraRoles.includes(EnterpriseAppRoleNames.Finance)) {
		for (const flag of FINANCE_GRANTABLE_FLAGS) grantable.add(flag);
	}
	return grantable;
}

/**
 * Returns the first permission flag the request would newly grant that the
 * caller's enterprise app roles cannot confer. Flags the persisted role
 * already holds pass through so full-payload edits and revocations keep
 * working.
 */
function findForbiddenPermissionGrant(permissions: StaffRolePermissionsInput | null | undefined, entraRoles: string[], currentPermissions?: CurrentStaffRolePermissions | null): string | undefined {
	if (!permissions) return undefined;
	const grantable = getGrantablePermissionFlags(entraRoles);
	for (const [group, flags] of Object.entries(PERMISSION_FLAGS_BY_GROUP)) {
		const requestedGroup = permissions[group as keyof StaffRolePermissionsInput] as Record<string, unknown> | null | undefined;
		if (!requestedGroup) continue;
		const currentGroup = currentPermissions?.[group as keyof CurrentStaffRolePermissions];
		for (const flag of flags) {
			if (requestedGroup[flag] !== true) continue;
			if (grantable.has(flag)) continue;
			if (currentGroup?.[flag] === true) continue;
			return flag;
		}
	}
	return undefined;
}

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

export function getAllowedEnterpriseAppRoles(entraRoles: string[]): string[] {
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
	const forbiddenGrant = findForbiddenPermissionGrant(input?.permissions, roles);
	if (forbiddenGrant) {
		return { errorMessage: `You do not have permission to grant the permission: ${forbiddenGrant}` };
	}
	const permissions = mapPermissionsInput(input?.permissions);
	return {
		roleName: input?.roleName ?? '',
		...(input?.enterpriseAppRole ? { enterpriseAppRole: input.enterpriseAppRole } : {}),
		...(permissions ? { permissions } : {}),
	};
}

export function buildStaffRoleUpdateCommand(
	input: NonNullable<MutationStaffRoleUpdateArgs['input']>,
	roles: string[],
	currentEnterpriseAppRole: string | null | undefined,
	currentPermissions?: CurrentStaffRolePermissions | null,
): StaffRoleUpdateCommand | { errorMessage: string } {
	const requestedEnterpriseAppRole = (input.enterpriseAppRole ?? '').trim();
	if (!requestedEnterpriseAppRole) {
		return { errorMessage: 'An enterprise app role is required to update a staff role' };
	}
	const allowedEnterpriseAppRoles = getAllowedEnterpriseAppRoles(roles);
	// A role without a persisted classification fails closed: only TechAdmin
	// (allowed to manage every tier) may modify it, so lower tiers cannot
	// rewrite an unclassified role that already carries elevated permissions.
	const currentTier = (currentEnterpriseAppRole ?? '').trim();
	if (!currentTier && !roles.includes(EnterpriseAppRoleNames.TechAdmin)) {
		return { errorMessage: 'You do not have permission to update a role without an enterprise app role type' };
	}
	if (currentTier && !allowedEnterpriseAppRoles.includes(currentTier)) {
		return { errorMessage: `You do not have permission to update a role of enterprise app role type: ${currentTier}` };
	}
	if (!allowedEnterpriseAppRoles.includes(requestedEnterpriseAppRole)) {
		return { errorMessage: `You do not have permission to update a role to enterprise app role type: ${requestedEnterpriseAppRole}` };
	}
	const forbiddenGrant = findForbiddenPermissionGrant(input.permissions, roles, currentPermissions);
	if (forbiddenGrant) {
		return { errorMessage: `You do not have permission to grant the permission: ${forbiddenGrant}` };
	}
	const permissions = mapPermissionsInput(input.permissions);
	return {
		roleId: input.id,
		roleName: input.roleName,
		enterpriseAppRole: requestedEnterpriseAppRole,
		...(permissions ? { permissions } : {}),
	};
}
