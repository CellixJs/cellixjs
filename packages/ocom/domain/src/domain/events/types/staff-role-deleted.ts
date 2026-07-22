import { CustomDomainEventImpl } from '@cellix/domain-seedwork/domain-event';

export interface StaffRoleDeletedProps {
	deletedRoleId: string;
	/**
	 * Enterprise app role of the deleted staff role. Carried on the payload
	 * because the staff role document is hard-deleted when the deletion
	 * commits, so handlers can no longer read it from the repository.
	 */
	enterpriseAppRole: string;
}

export class StaffRoleDeletedEvent extends CustomDomainEventImpl<StaffRoleDeletedProps> {}
