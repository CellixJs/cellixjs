import { type Model, type ObjectId, Schema, type SchemaDefinition } from 'mongoose';
import { type Role, type RoleModelType, roleOptions } from './role.model.ts';

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
	canWorkOnTickets: boolean;
	// isSystemAccount: false;
}

export interface StaffRoleViolationTicketPermissions {
	id?: ObjectId;
	canCreateTickets: boolean;
	canManageTickets: boolean;
	canAssignTickets: boolean;
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
	canManageStaffRolesAndPermissions: boolean;
	canManageAllCommunities: boolean;
	canDeleteCommunities: boolean;
	canChangeCommunityOwner: boolean;
	canReIndexSearchCollections: boolean;
}

export interface StaffRolePermissions {
	id?: ObjectId;
	servicePermissions: StaffRoleServicePermissions;
	serviceTicketPermissions: StaffRoleServiceTicketPermissions;
	violationTicketPermissions: StaffRoleViolationTicketPermissions;
	communityPermissions: StaffRoleCommunityPermissions;
	propertyPermissions: StaffRolePropertyPermissions;
}

export interface StaffRole extends Role {
	permissions: StaffRolePermissions;

	roleName: string;
	roleType?: string;
	isDefault: boolean;
}

const StaffRoleSchema = new Schema<
	StaffRole,
	Model<StaffRole>,
	StaffRole
>(
	{
		permissions: {
			servicePermissions: {
				canManageServices: { type: Boolean, required: true, default: false },
			} as SchemaDefinition<StaffRoleServicePermissions>,
			serviceTicketPermissions: {
				canCreateTickets: { type: Boolean, required: true, default: false },
				canManageTickets: { type: Boolean, required: true, default: false },
				canAssignTickets: { type: Boolean, required: true, default: false },
				canWorkOnTickets: { type: Boolean, required: true, default: false, index: true },
			} as SchemaDefinition<StaffRoleServiceTicketPermissions>,
			violationTicketPermissions: {
				canCreateTickets: { type: Boolean, required: true, default: false },
				canManageTickets: { type: Boolean, required: true, default: false },
				canAssignTickets: { type: Boolean, required: true, default: false },
				canWorkOnTickets: { type: Boolean, required: true, default: false, index: true },
			} as SchemaDefinition<StaffRoleViolationTicketPermissions>,
			communityPermissions: {
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
			propertyPermissions: {
				// canManageProperties: { type: Boolean, required: true, default: false },
				// canEditOwnProperty: { type: Boolean, required: true, default: false },
			} as SchemaDefinition<StaffRolePropertyPermissions>,
		} as SchemaDefinition<StaffRolePermissions>,
		schemaVersion: { type: String, default: '1.0.0' },
		roleName: { type: String, required: true, maxlength: 50 },
		isDefault: { type: Boolean, required: true, default: false },
	},
	roleOptions,
).index({ roleName: 1 }, { unique: true });

export const StaffRoleModelName: string = 'staff-roles';

export const StaffRoleModelFactory = (RoleModel: RoleModelType) => {
    return RoleModel.discriminator(StaffRoleModelName, StaffRoleSchema);
};

export type StaffRoleModelType = ReturnType<typeof StaffRoleModelFactory>;

