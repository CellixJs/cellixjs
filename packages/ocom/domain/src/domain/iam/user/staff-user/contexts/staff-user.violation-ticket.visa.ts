import type { CaseDomainPermissions } from '../../../../contexts/case/case.domain-permissions.ts';
import type { CaseVisa } from '../../../../contexts/case/case.visa.ts';

export class StaffUserViolationTicketVisa implements CaseVisa {
	determineIf(
		func: (permissions: Readonly<CaseDomainPermissions>) => boolean,
	): boolean {
		const permissions: CaseDomainPermissions = {
			canCreateTickets: true,
			canManageTickets: true,
			canAssignTickets: true,
			canWorkOnTickets: true,
			isEditingOwnTicket: false,
			isEditingAssignedTicket: false,
			isSystemAccount: false,
		};

		return func(permissions);
	}
}
