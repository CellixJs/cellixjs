import { type Model, type ObjectId, Schema, type SchemaDefinition } from 'mongoose';
import { type Role, type RoleModelType, roleOptions } from './role.model.ts';

export const StaffEnterpriseAppRoles = ['Staff.CaseManager', 'Staff.Finance', 'Staff.ServiceLineOwner', 'Staff.TechAdmin'] as const;

export interface StaffRoleServicePermissions {
	id?: ObjectId;
	canManageServices: boolean;
	// isSystemAccount: false;
}

export interface StaffRoleServiceTicketPermissions {
	id?: ObjectId;
	canCreateTickets: boolean;
	canManageTickets: boolean;
	canAssignTickets: boolean;
	canUpdateTickets: boolean;
	canWorkOnTickets: boolean;
	// isSystemAccount: false;
}

export interface StaffRoleViolationTicketPermissions {
	id?: ObjectId;
	canCreateTickets: boolean;
	canManageTickets: boolean;
	canAssignTickets: boolean;
	canUpdateTickets: boolean;
	canWorkOnTickets: boolean;
	// isSystemAccount: false;
}

export interface StaffRolePropertyPermissions {
	id?: ObjectId;
	canManageProperties: boolean;
	canEditOwnProperty: boolean;
	// isSystemAccount: false;
}

export interface StaffRoleCommunityPermissions {
	id?: ObjectId;
	canManageCommunities: boolean;
	canManageStaffRolesAndPermissions: boolean;
	canManageAllCommunities: boolean;
	canDeleteCommunities: boolean;
	canChangeCommunityOwner: boolean;
	canReIndexSearchCollections: boolean;
}

export interface StaffRoleFinancePermissions {
	id?: ObjectId;
	canManageFinance: boolean;
	canViewGLBatchSummaries: boolean;
	canViewFinanceConfigs: boolean;
	canCreateFinanceConfigs: boolean;
}

export interface StaffRoleTechAdminPermissions {
	id?: ObjectId;
	canManageTechAdmin: boolean;
	canViewDatabaseDocuments: boolean;
	canViewBlobExplorer: boolean;
	canViewQueueDashboard: boolean;
	canSendQueueMessages: boolean;
}

export interface StaffRoleUserPermissions {
	id?: ObjectId;
	canManageUsers: boolean;
	canAssignStaffRoles: boolean;
	canAssignStaffUserRoles?: boolean;
	canViewStaffUsers: boolean;
}

export interface StaffRoleRolePermissions {
	id?: ObjectId;
	canViewRoles: boolean;
	canAddRole: boolean;
	canEditRole: boolean;
	canRemoveRole: boolean;
}

export interface StaffRolePermissions {
	id?: ObjectId;
	servicePermissions: StaffRoleServicePermissions;
	serviceTicketPermissions: StaffRoleServiceTicketPermissions;
	violationTicketPermissions: StaffRoleViolationTicketPermissions;
	communityPermissions: StaffRoleCommunityPermissions;
	financePermissions: StaffRoleFinancePermissions;
	techAdminPermissions: StaffRoleTechAdminPermissions;
	userPermissions: StaffRoleUserPermissions;
	staffRolePermissions: StaffRoleRolePermissions;
	propertyPermissions: StaffRolePropertyPermissions;
}

export interface StaffRole extends Role {
	permissions: StaffRolePermissions;

	roleName: string;
	enterpriseAppRole?: string;
	roleType?: string;
	isDefault: boolean;
}

const StaffRoleSchema = new Schema<StaffRole, Model<StaffRole>, StaffRole>(
	{
		permissions: {
			servicePermissions: {
				canManageServices: { type: Boolean, required: true, default: false },
			} as SchemaDefinition<StaffRoleServicePermissions>,
			serviceTicketPermissions: {
				canCreateTickets: { type: Boolean, required: true, default: false },
				canManageTickets: { type: Boolean, required: true, default: false },
				canAssignTickets: { type: Boolean, required: true, default: false },
				canUpdateTickets: { type: Boolean, required: true, default: false },
				canWorkOnTickets: { type: Boolean, required: true, default: false, index: true },
			} as SchemaDefinition<StaffRoleServiceTicketPermissions>,
			violationTicketPermissions: {
				canCreateTickets: { type: Boolean, required: true, default: false },
				canManageTickets: { type: Boolean, required: true, default: false },
				canAssignTickets: { type: Boolean, required: true, default: false },
				canUpdateTickets: { type: Boolean, required: true, default: false },
				canWorkOnTickets: { type: Boolean, required: true, default: false, index: true },
			} as SchemaDefinition<StaffRoleViolationTicketPermissions>,
			communityPermissions: {
				canManageCommunities: { type: Boolean, required: true, default: false },
				canManageStaffRolesAndPermissions: {
					type: Boolean,
					required: true,
					default: false,
				},
				canManageAllCommunities: {
					type: Boolean,
					required: true,
					default: false,
				},
				canDeleteCommunities: { type: Boolean, required: true, default: false },
				canChangeCommunityOwner: {
					type: Boolean,
					required: true,
					default: false,
				},
				canReIndexSearchCollections: {
					type: Boolean,
					required: true,
					default: false,
				},
			} as SchemaDefinition<StaffRoleCommunityPermissions>,
			financePermissions: {
				canManageFinance: { type: Boolean, required: true, default: false },
				canViewGLBatchSummaries: { type: Boolean, required: true, default: false },
				canViewFinanceConfigs: { type: Boolean, required: true, default: false },
				canCreateFinanceConfigs: { type: Boolean, required: true, default: false },
			} as SchemaDefinition<StaffRoleFinancePermissions>,
			techAdminPermissions: {
				canManageTechAdmin: { type: Boolean, required: true, default: false },
				canViewDatabaseDocuments: { type: Boolean, required: true, default: false },
				canViewBlobExplorer: { type: Boolean, required: true, default: false },
				canViewQueueDashboard: { type: Boolean, required: true, default: false },
				canSendQueueMessages: { type: Boolean, required: true, default: false },
			} as SchemaDefinition<StaffRoleTechAdminPermissions>,
			userPermissions: {
				canManageUsers: { type: Boolean, required: true, default: false },
				canAssignStaffRoles: { type: Boolean, required: true, default: false },
				canAssignStaffUserRoles: { type: Boolean, required: true, default: false },
				canViewStaffUsers: { type: Boolean, required: true, default: false },
			} as SchemaDefinition<StaffRoleUserPermissions>,
			staffRolePermissions: {
				canViewRoles: { type: Boolean, required: true, default: false },
				canAddRole: { type: Boolean, required: true, default: false },
				canEditRole: { type: Boolean, required: true, default: false },
				canRemoveRole: { type: Boolean, required: true, default: false },
			} as SchemaDefinition<StaffRoleRolePermissions>,
			propertyPermissions: {
				canManageProperties: { type: Boolean, required: true, default: false },
				canEditOwnProperty: { type: Boolean, required: true, default: false },
			} as SchemaDefinition<StaffRolePropertyPermissions>,
		} as SchemaDefinition<StaffRolePermissions>,
		schemaVersion: { type: String, default: '1.0.0', immutable: true },
		roleName: { type: String, required: true, maxlength: 256 },
		enterpriseAppRole: {
			type: String,
			required: true,
			enum: StaffEnterpriseAppRoles,
		},
		isDefault: { type: Boolean, required: true, default: false },
	},
	roleOptions,
).index({ roleName: 1 }, { unique: true });

export const StaffRoleModelName: string = 'staff-user-role';

export const StaffRoleModelFactory = (RoleModel: RoleModelType) => {
	return RoleModel.discriminator(StaffRoleModelName, StaffRoleSchema);
};

export type StaffRoleModelType = ReturnType<typeof StaffRoleModelFactory>;
