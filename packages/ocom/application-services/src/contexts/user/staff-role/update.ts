import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

interface StaffRoleUpdateCommandCommunityPermissions {
	canManageCommunities?: boolean;
	canManageStaffRolesAndPermissions?: boolean;
	canManageAllCommunities?: boolean;
	canDeleteCommunities?: boolean;
	canChangeCommunityOwner?: boolean;
	canReIndexSearchCollections?: boolean;
}

interface StaffRoleUpdateCommandUserPermissions {
	canManageUsers?: boolean;
	canAssignStaffRoles?: boolean;
	canAssignStaffUserRoles?: boolean;
	canViewStaffUsers?: boolean;
}

interface StaffRoleUpdateCommandRolePermissions {
	canViewRoles?: boolean;
	canAddRole?: boolean;
	canEditRole?: boolean;
	canRemoveRole?: boolean;
}

interface StaffRoleUpdateCommandFinancePermissions {
	canManageFinance?: boolean;
	canViewGLBatchSummaries?: boolean;
	canViewFinanceConfigs?: boolean;
	canCreateFinanceConfigs?: boolean;
}

interface StaffRoleUpdateCommandTechAdminPermissions {
	canManageTechAdmin?: boolean;
	canViewDatabaseExplorer?: boolean;
	canViewBlobExplorer?: boolean;
	canViewQueueDashboard?: boolean;
	canSendQueueMessages?: boolean;
}

interface StaffRoleUpdateCommandPermissions {
	community?: StaffRoleUpdateCommandCommunityPermissions;
	user?: StaffRoleUpdateCommandUserPermissions;
	staffRole?: StaffRoleUpdateCommandRolePermissions;
	finance?: StaffRoleUpdateCommandFinancePermissions;
	techAdmin?: StaffRoleUpdateCommandTechAdminPermissions;
}

export interface StaffRoleUpdateCommand {
	roleId: string;
	roleName: string;
	enterpriseAppRole?: string;
	permissions?: StaffRoleUpdateCommandPermissions;
}

const applyCommunityPermissions = (staffRole: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>, permissions?: StaffRoleUpdateCommandCommunityPermissions) => {
	if (!permissions) return;
	const { communityPermissions } = staffRole.permissions;
	if (permissions.canManageCommunities !== undefined) communityPermissions.canManageCommunities = permissions.canManageCommunities;
	if (permissions.canManageStaffRolesAndPermissions !== undefined) communityPermissions.canManageStaffRolesAndPermissions = permissions.canManageStaffRolesAndPermissions;
	if (permissions.canManageAllCommunities !== undefined) communityPermissions.canManageAllCommunities = permissions.canManageAllCommunities;
	if (permissions.canDeleteCommunities !== undefined) communityPermissions.canDeleteCommunities = permissions.canDeleteCommunities;
	if (permissions.canChangeCommunityOwner !== undefined) communityPermissions.canChangeCommunityOwner = permissions.canChangeCommunityOwner;
	if (permissions.canReIndexSearchCollections !== undefined) communityPermissions.canReIndexSearchCollections = permissions.canReIndexSearchCollections;
};

const applyUserPermissions = (staffRole: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>, permissions?: StaffRoleUpdateCommandUserPermissions) => {
	if (!permissions) return;
	const { userPermissions } = staffRole.permissions;
	if (permissions.canManageUsers !== undefined) userPermissions.canManageUsers = permissions.canManageUsers;
	if (permissions.canAssignStaffUserRoles !== undefined) userPermissions.canAssignStaffUserRoles = permissions.canAssignStaffUserRoles;
	if (permissions.canAssignStaffRoles !== undefined) {
		userPermissions.canAssignStaffRoles = permissions.canAssignStaffRoles;
		userPermissions.canAssignStaffUserRoles = permissions.canAssignStaffRoles;
	}
	if (permissions.canAssignStaffUserRoles !== undefined) {
		userPermissions.canAssignStaffRoles = permissions.canAssignStaffUserRoles;
		userPermissions.canAssignStaffUserRoles = permissions.canAssignStaffUserRoles;
	}
	if (permissions.canViewStaffUsers !== undefined) userPermissions.canViewStaffUsers = permissions.canViewStaffUsers;
};

const applyRolePermissions = (staffRole: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>, permissions?: StaffRoleUpdateCommandRolePermissions) => {
	if (!permissions) return;
	const { staffRolePermissions } = staffRole.permissions;
	if (permissions.canViewRoles !== undefined) staffRolePermissions.canViewRoles = permissions.canViewRoles;
	if (permissions.canAddRole !== undefined) staffRolePermissions.canAddRole = permissions.canAddRole;
	if (permissions.canEditRole !== undefined) staffRolePermissions.canEditRole = permissions.canEditRole;
	if (permissions.canRemoveRole !== undefined) staffRolePermissions.canRemoveRole = permissions.canRemoveRole;
};

const applyFinancePermissions = (staffRole: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>, permissions?: StaffRoleUpdateCommandFinancePermissions) => {
	if (!permissions) return;
	const { financePermissions } = staffRole.permissions;
	if (permissions.canManageFinance !== undefined) financePermissions.canManageFinance = permissions.canManageFinance;
	if (permissions.canViewGLBatchSummaries !== undefined) financePermissions.canViewGLBatchSummaries = permissions.canViewGLBatchSummaries;
	if (permissions.canViewFinanceConfigs !== undefined) financePermissions.canViewFinanceConfigs = permissions.canViewFinanceConfigs;
	if (permissions.canCreateFinanceConfigs !== undefined) financePermissions.canCreateFinanceConfigs = permissions.canCreateFinanceConfigs;
};

const applyTechAdminPermissions = (staffRole: Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>, permissions?: StaffRoleUpdateCommandTechAdminPermissions) => {
	if (!permissions) return;
	const { techAdminPermissions } = staffRole.permissions;
	if (permissions.canManageTechAdmin !== undefined) techAdminPermissions.canManageTechAdmin = permissions.canManageTechAdmin;
	if (permissions.canViewDatabaseExplorer !== undefined) techAdminPermissions.canViewDatabaseExplorer = permissions.canViewDatabaseExplorer;
	if (permissions.canViewBlobExplorer !== undefined) techAdminPermissions.canViewBlobExplorer = permissions.canViewBlobExplorer;
	if (permissions.canViewQueueDashboard !== undefined) techAdminPermissions.canViewQueueDashboard = permissions.canViewQueueDashboard;
	if (permissions.canSendQueueMessages !== undefined) techAdminPermissions.canSendQueueMessages = permissions.canSendQueueMessages;
};

export const update = (dataSources: DataSources) => {
	return async (command: StaffRoleUpdateCommand): Promise<Domain.Contexts.User.StaffRole.StaffRoleEntityReference> => {
		let updatedRole: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | undefined;

		await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (repository) => {
			const staffRole = await repository.getById(command.roleId);
			staffRole.roleName = command.roleName;
			if (command.enterpriseAppRole) {
				staffRole.enterpriseAppRole = command.enterpriseAppRole;
			}
			applyCommunityPermissions(staffRole, command.permissions?.community);
			applyUserPermissions(staffRole, command.permissions?.user);
			applyRolePermissions(staffRole, command.permissions?.staffRole);
			applyFinancePermissions(staffRole, command.permissions?.finance);
			applyTechAdminPermissions(staffRole, command.permissions?.techAdmin);
			updatedRole = await repository.save(staffRole);
		});

		if (!updatedRole) {
			throw new Error('Unable to update staff role');
		}

		return updatedRole;
	};
};
