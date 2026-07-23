import { StaffRoleDeletedReassignmentService } from './staff-role-deleted-reassignment.service.ts';
import { StaffRoleDeletionRecoveryService } from './staff-role-deletion-recovery.service.ts';

export const User = {
	StaffRoleDeletedReassignmentService: new StaffRoleDeletedReassignmentService(),
	StaffRoleDeletionRecoveryService: new StaffRoleDeletionRecoveryService(),
};
