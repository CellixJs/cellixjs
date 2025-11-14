import { ValueObject } from '@cellix/domain-seedwork/value-object';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
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
		ValueObjectProps {}
export interface StaffRoleViolationTicketPermissionsEntityReference
	extends Readonly<StaffRoleViolationTicketPermissionsProps> {}

export class StaffRoleViolationTicketPermissions
	extends ValueObject<StaffRoleViolationTicketPermissionsProps>
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
	    throw new PermissionError('Cannot set permission');
	  }
	  this.props.canCreateTickets = value;
	}

	set canManageTickets(value: boolean) {
	  if (!this.visa.determineIf((permissions) => permissions.canManageStaffRolesAndPermissions || permissions.isSystemAccount)) {
	    throw new PermissionError('Cannot set permission');
	  }
	  this.props.canManageTickets = value;
	}

	set canAssignTickets(value: boolean) {
	  if (!this.visa.determineIf((permissions) => permissions.canManageStaffRolesAndPermissions || permissions.isSystemAccount)) {
	    throw new PermissionError('Cannot set permission');
	  }
	  this.props.canAssignTickets = value;
	}

	set canWorkOnTickets(value: boolean) {
	  if (!this.visa.determineIf((permissions) => permissions.canManageStaffRolesAndPermissions || permissions.isSystemAccount)) {
	    throw new PermissionError('Cannot set permission');
	  }
	  this.props.canWorkOnTickets = value;
	}
}
