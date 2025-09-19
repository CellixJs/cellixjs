export interface CaseDomainPermissions {
	canCreateTickets: boolean;
	canManageTickets: boolean;
	canAssignTickets: boolean;
	canWorkOnTickets: boolean;
	isEditingOwnTicket: boolean;
	isEditingAssignedTicket: boolean;
	isSystemAccount: boolean;
}
