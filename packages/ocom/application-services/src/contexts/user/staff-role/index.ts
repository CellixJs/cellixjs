import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import {
	create,
	type StaffRoleCreateCommand,
	type StaffRolePermissionsCommand,
	type StaffRoleCommunityPermissionsCommand,
} from './create.ts';
import {
	deleteAndReassign,
	type StaffRoleDeleteAndReassignCommand,
} from './delete-and-reassign.ts';
import {
	queryById,
	type StaffRoleQueryByIdCommand,
} from './query-by-id.ts';
import {
	queryByRoleName,
	type StaffRoleQueryByRoleNameCommand,
} from './query-by-role-name.ts';

export interface StaffRoleApplicationService {
	create: (
		command: StaffRoleCreateCommand,
	) => Promise<Domain.Contexts.User.StaffRole.StaffRoleEntityReference>;
	deleteAndReassign: (
		command: StaffRoleDeleteAndReassignCommand,
	) => Promise<void>;
	queryById: (
		command: StaffRoleQueryByIdCommand,
	) => Promise<Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null>;
	queryByRoleName: (
		command: StaffRoleQueryByRoleNameCommand,
	) => Promise<Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null>;
}

export type {
	StaffRoleCreateCommand,
	StaffRolePermissionsCommand,
	StaffRoleCommunityPermissionsCommand,
	StaffRoleDeleteAndReassignCommand,
	StaffRoleQueryByIdCommand,
	StaffRoleQueryByRoleNameCommand,
};

export const StaffRole = (
	dataSources: DataSources,
): StaffRoleApplicationService => {
	return {
		create: create(dataSources),
		deleteAndReassign: deleteAndReassign(dataSources),
		queryById: queryById(dataSources),
		queryByRoleName: queryByRoleName(dataSources),
	};
};