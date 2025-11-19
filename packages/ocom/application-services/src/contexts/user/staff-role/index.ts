import type { DataSources } from '@ocom/persistence';
import {
	create,
	type StaffRoleCreateCommand,
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
import type { StaffRoleEntityReference } from '@ocom/domain/contexts/staff-role';
	queryByRoleName,
	type StaffRoleQueryByRoleNameCommand,
} from './query-by-role-name.ts';

export interface StaffRoleApplicationService {
	create: (
		command: StaffRoleCreateCommand,
	) => Promise<StaffRoleEntityReference>;
	deleteAndReassign: (
		command: StaffRoleDeleteAndReassignCommand,
	) => Promise<void>;
	queryById: (
		command: StaffRoleQueryByIdCommand,
	) => Promise<StaffRoleEntityReference | null>;
	queryByRoleName: (
		command: StaffRoleQueryByRoleNameCommand,
	) => Promise<StaffRoleEntityReference | null>;
}

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