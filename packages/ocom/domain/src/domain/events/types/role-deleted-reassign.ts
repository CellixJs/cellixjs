import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';

export interface RoleDeletedReassignProps {
	deletedRoleId: string;
	newRoleId: string;
}

export class RoleDeletedReassignEvent extends DomainSeedwork.CustomDomainEventImpl<RoleDeletedReassignProps> {}
