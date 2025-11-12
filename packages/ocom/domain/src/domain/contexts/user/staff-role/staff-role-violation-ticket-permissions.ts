import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { UserVisa } from '../user.visa.ts';

interface StaffRoleViolationTicketPermissionsSpec {
	canCreateTickets: boolean;
	canManageTickets: boolean;
	canAssignTickets: boolean;
	canWorkOnTickets: boolean;
	// isSystemAccount: boolean;
}

export interface StaffRoleViolationTicketPermissionsProps
	extends StaffRoleViolationTicketPermissionsSpec,
		DomainSeedwork.ValueObjectProps {}
export interface StaffRoleViolationTicketPermissionsEntityReference
	extends Readonly<StaffRoleViolationTicketPermissionsProps> {}

export class StaffRoleViolationTicketPermissions
	extends DomainSeedwork.ValueObject<StaffRoleViolationTicketPermissionsProps>
	implements StaffRoleViolationTicketPermissionsEntityReference
{
	private readonly visa: UserVisa;
	constructor(
		props: StaffRoleViolationTicketPermissionsProps,
		visa: UserVisa,
	) {
		super(props);
		this.visa = visa;
	}

	get canCreateTickets(): boolean {
	  return this.props.canCreateTickets;
	}
	get canManageTickets(): boolean {
	  return this.props.canManageTickets;
	}
	get canAssignTickets(): boolean {
	  return this.props.canAssignTickets;
	}
	get canWorkOnTickets(): boolean {
	  return this.props.canWorkOnTickets;
	}
	// get isSystemAccount(): boolean {
	//   return false;
	// }

	// setters using ts 5.1

	set canCreateTickets(value: boolean) {
	  if (!this.visa.determineIf((permissions) => permissions.canManageStaffRolesAndPermissions || permissions.isSystemAccount)) {
	    throw new DomainSeedwork.PermissionError('Cannot set permission');
	  }
	  this.props.canCreateTickets = value;
	}

	set canManageTickets(value: boolean) {
	  if (!this.visa.determineIf((permissions) => permissions.canManageStaffRolesAndPermissions || permissions.isSystemAccount)) {
	    throw new DomainSeedwork.PermissionError('Cannot set permission');
	  }
	  this.props.canManageTickets = value;
	}

	set canAssignTickets(value: boolean) {
	  if (!this.visa.determineIf((permissions) => permissions.canManageStaffRolesAndPermissions || permissions.isSystemAccount)) {
	    throw new DomainSeedwork.PermissionError('Cannot set permission');
	  }
	  this.props.canAssignTickets = value;
	}

	set canWorkOnTickets(value: boolean) {
	  if (!this.visa.determineIf((permissions) => permissions.canManageStaffRolesAndPermissions || permissions.isSystemAccount)) {
	    throw new DomainSeedwork.PermissionError('Cannot set permission');
	  }
	  this.props.canWorkOnTickets = value;
	}
}
