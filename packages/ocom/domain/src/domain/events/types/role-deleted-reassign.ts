import { CustomDomainEventImpl } from '@cellix/domain-seedwork/domain-event';
export interface RoleDeletedReassignProps {
	deletedRoleId: string;
	newRoleId: string;
}

export class RoleDeletedReassignEvent extends CustomDomainEventImpl<RoleDeletedReassignProps> {}
