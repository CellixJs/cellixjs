import { CustomDomainEventImpl } from '@cellix/domain-seedwork/domain-event';

export interface StaffRoleDeletedProps {
	deletedRoleId: string;
	actorStaffUserId: string;
	/**
	 * Enterprise app role captured when the staff role was logically deleted.
	 * Carrying it on the event keeps repeated processing stable.
	 */
	enterpriseAppRole: string;
}

export class StaffRoleDeletedEvent extends CustomDomainEventImpl<StaffRoleDeletedProps> {}
