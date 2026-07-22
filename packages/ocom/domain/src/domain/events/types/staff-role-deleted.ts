import { CustomDomainEventImpl } from '@cellix/domain-seedwork/domain-event';

export interface StaffRoleDeletedProps {
	deletedRoleId: string;
	actorStaffUserId: string;
	/**
	 * Enterprise app role of the deleted staff role. Carried on the payload
	 * so cleanup handlers can resolve the matching default role without
	 * exposing the archived role through normal repositories.
	 */
	enterpriseAppRole: string;
}

export class StaffRoleDeletedEvent extends CustomDomainEventImpl<StaffRoleDeletedProps> {}
