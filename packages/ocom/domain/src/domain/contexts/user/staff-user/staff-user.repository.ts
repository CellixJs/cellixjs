import type { Repository } from '@cellix/domain-seedwork/repository';
import type { StaffUser, StaffUserProps } from './staff-user.ts';
import type { ActivityTypeCodeValue } from './staff-user-activity-log.value-objects.ts';

export interface SetStaffUserRoleIfCurrentCommand {
	staffUserId: string;
	expectedCurrentRoleId: string;
	replacementRoleId?: string;
	expectedUpdatedAt?: Date;
	activityType: ActivityTypeCodeValue;
	activityDescription: string;
	activityByStaffUserId: string;
}

export interface StaffUserRepository<props extends StaffUserProps> extends Repository<StaffUser<props>> {
	delete(id: string): Promise<void>;
	getAssignedRoleIds(roleIds: string[]): Promise<string[]>;
	getByExternalId(externalId: string): Promise<StaffUser<props>>;
	getAllAssignedToRole(roleId: string): Promise<StaffUser<props>[]>;
	getNewInstance(externalId: string, firstName: string, lastName: string, email: string): Promise<StaffUser<props>>;
	setRoleIfCurrent(command: SetStaffUserRoleIfCurrentCommand): Promise<boolean>;
}
