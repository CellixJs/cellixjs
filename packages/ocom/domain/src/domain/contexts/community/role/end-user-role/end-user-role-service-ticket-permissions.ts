import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { CaseDomainPermissions } from '../../../case/case.domain-permissions.ts';
import type { CommunityVisa } from '../../community.visa.ts';

export interface EndUserRoleServiceTicketPermissionsProps
	extends Omit<
			CaseDomainPermissions,
			'isEditingOwnTicket' | 'isEditingAssignedTicket' | 'isSystemAccount'
		>,
		DomainSeedwork.ValueObjectProps {}
export interface EndUserRoleServiceTicketPermissionsEntityReference
	extends Readonly<EndUserRoleServiceTicketPermissionsProps> {}

export class EndUserRoleServiceTicketPermissions
	extends DomainSeedwork.ValueObject<EndUserRoleServiceTicketPermissionsProps>
	implements EndUserRoleServiceTicketPermissionsEntityReference
{
	//#region Fields
	private readonly visa: CommunityVisa;
	//#endregion Fields
	//#region Constructors
	constructor(
		props: EndUserRoleServiceTicketPermissionsProps,
		visa: CommunityVisa,
	) {
		super(props);
		this.visa = visa;
	}
	//#endregion Constructors
	//#region Properties

	get canCreateTickets(): boolean {
		return this.props.canCreateTickets;
	}
	set canCreateTickets(value: boolean) {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageEndUserRolesAndPermissions ||
					permissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set permission');
		}
		this.props.canCreateTickets = value;
	}
	get canManageTickets(): boolean {
		return this.props.canManageTickets;
	}
	set canManageTickets(value: boolean) {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageEndUserRolesAndPermissions ||
					permissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set permission');
		}
		this.props.canManageTickets = value;
	}

	get canAssignTickets(): boolean {
		return this.props.canAssignTickets;
	}
	set canAssignTickets(value: boolean) {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageEndUserRolesAndPermissions ||
					permissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set permission');
		}
		this.props.canAssignTickets = value;
	}
	get canWorkOnTickets(): boolean {
		return this.props.canWorkOnTickets;
	}
	set canWorkOnTickets(value: boolean) {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageEndUserRolesAndPermissions ||
					permissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set permission');
		}
		this.props.canWorkOnTickets = value;
	}
	//#endregion Properties
}
