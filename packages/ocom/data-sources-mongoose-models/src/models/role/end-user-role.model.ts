import type { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { type Model, type ObjectId, type PopulatedDoc, Schema, type SchemaDefinition } from 'mongoose';
import * as Community from '../community/community.model.ts';
import { type Role, type RoleModelType, roleOptions } from './role.model.ts';

export interface EndUserRoleServicePermissions extends MongooseSeedwork.NestedPath {
	id?: ObjectId;
	canManageServices: boolean;
	isSystemAccount: false;
}

export interface EndUserRoleServiceTicketPermissions extends MongooseSeedwork.NestedPath {
	id?: ObjectId;
	canCreateTickets: boolean;
	canManageTickets: boolean;
	canAssignTickets: boolean;
	canWorkOnTickets: boolean;
	isEditingOwnTicket: false;
	isEditingAssignedTicket: false;
	isSystemAccount: false;
}

export interface EndUserRoleViolationTicketPermissions extends MongooseSeedwork.NestedPath {
	id?: ObjectId;
	canCreateTickets: boolean;
	canManageTickets: boolean;
	canAssignTickets: boolean;
	canWorkOnTickets: boolean;
	isEditingOwnTicket: false;
	isEditingAssignedTicket: false;
	isSystemAccount: false;
}

export interface EndUserRolePropertyPermissions extends MongooseSeedwork.NestedPath {
	id?: ObjectId;
	canManageProperties: boolean;
	canEditOwnProperty: boolean;
	isEditingOwnProperty: false;
	isSystemAccount: false;
}

export interface EndUserRoleCommunityPermissions extends MongooseSeedwork.NestedPath {
	id?: ObjectId;
	canManageRolesAndPermissions: boolean;
	canManageCommunitySettings: boolean;
	canManageSiteContent: boolean;
	canManageMembers: boolean;
	canEditOwnMemberProfile: boolean;
	canEditOwnMemberAccounts: boolean;
	isEditingOwnMemberAccount: false;
	isSystemAccount: false;
}

export interface EndUserRolePermissions extends MongooseSeedwork.NestedPath {
	id?: ObjectId;
	servicePermissions: EndUserRoleServicePermissions;
	serviceTicketPermissions: EndUserRoleServiceTicketPermissions;
	violationTicketPermissions: EndUserRoleViolationTicketPermissions;
	communityPermissions: EndUserRoleCommunityPermissions;
	propertyPermissions: EndUserRolePropertyPermissions;
}

export interface EndUserRole extends Role {
	community: PopulatedDoc<Community.Community> | ObjectId;
	permissions: EndUserRolePermissions;

	roleName: string;
	roleType?: string;
	isDefault: boolean;
}

const EndUserRoleSchema = new Schema<
	EndUserRole,
	Model<EndUserRole>,
	EndUserRole
>(
	{
		community: {
			type: Schema.Types.ObjectId,
			ref: Community.CommunityModelName,
			required: true,
			index: true,
		},
		permissions: {
			servicePermissions: {
				canManageServices: { type: Boolean, required: true, default: false },
			} as SchemaDefinition<EndUserRoleServicePermissions>,
			serviceTicketPermissions: {
				canCreateTickets: { type: Boolean, required: true, default: false },
				canManageTickets: { type: Boolean, required: true, default: false },
				canAssignTickets: { type: Boolean, required: true, default: false },
				canWorkOnTickets: {
					type: Boolean,
					required: true,
					default: false,
					index: true,
				},
			} as SchemaDefinition<EndUserRoleServiceTicketPermissions>,
			violationTicketPermissions: {
				canCreateTickets: { type: Boolean, required: true, default: false },
				canManageTickets: { type: Boolean, required: true, default: false },
				canAssignTickets: { type: Boolean, required: true, default: false },
				canWorkOnTickets: {
					type: Boolean,
					required: true,
					default: false,
					index: true,
				},
			} as SchemaDefinition<EndUserRoleViolationTicketPermissions>,
			communityPermissions: {
				canManageRolesAndPermissions: {
					type: Boolean,
					required: true,
					default: false,
				},
				canManageCommunitySettings: {
					type: Boolean,
					required: true,
					default: false,
				},
				canManageSiteContent: { type: Boolean, required: true, default: false },
				canManageMembers: { type: Boolean, required: true, default: false },
				canEditOwnMemberProfile: {
					type: Boolean,
					required: true,
					default: false,
				},
				canEditOwnMemberAccounts: {
					type: Boolean,
					required: true,
					default: false,
				},
			} as SchemaDefinition<EndUserRoleCommunityPermissions>,
			propertyPermissions: {
				canManageProperties: { type: Boolean, required: true, default: false },
				canEditOwnProperty: { type: Boolean, required: true, default: false },
			} as SchemaDefinition<EndUserRolePropertyPermissions>,
		} as SchemaDefinition<EndUserRolePermissions>,
		schemaVersion: { type: String, default: '1.0.0' },
		roleName: { type: String, required: true, maxlength: 50 },
		isDefault: { type: Boolean, required: true, default: false },
	},
	roleOptions,
).index({ roleName: 1, community: 1 }, { unique: true });

export const EndUserRoleModelName: string = 'end-user-roles';

export const EndUserRoleModelFactory = (RoleModel: RoleModelType) => {
    return RoleModel.discriminator(EndUserRoleModelName, EndUserRoleSchema);
};

export type EndUserRoleModelType = ReturnType<typeof EndUserRoleModelFactory>;
