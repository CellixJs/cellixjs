import { DomainSeedwork } from '@cellix/domain-seedwork';
import type { UserVisa } from '../user.visa.ts';

interface StaffRolePropertyPermissionsSpec {
	canManageProperties: boolean;
	canEditOwnProperty: boolean;
	// isEditingOwnProperty: boolean;
	// isSystemAccount: boolean;
}

export interface StaffRolePropertyPermissionsProps
	extends StaffRolePropertyPermissionsSpec,
		DomainSeedwork.ValueObjectProps {}
export interface StaffRolePropertyPermissionsEntityReference
	extends Readonly<StaffRolePropertyPermissionsProps> {}

export class StaffRolePropertyPermissions
	extends DomainSeedwork.ValueObject<StaffRolePropertyPermissionsProps>
	implements StaffRolePropertyPermissionsEntityReference
{
	private readonly visa: UserVisa;
	constructor(props: StaffRolePropertyPermissionsProps, visa: UserVisa) {
		super(props);
		this.visa = visa;
	}

	get canManageProperties(): boolean {
	  return this.props.canManageProperties;
	}
	get canEditOwnProperty(): boolean {
	  return this.props.canEditOwnProperty;
	}
	// get isEditingOwnProperty(): boolean {
	//   return false;
	// }
	// get isSystemAccount(): boolean {
	//   return false;
	// }

	// setters using TS 5.1

	set canManageProperties(value: boolean) {
	  if (!this.visa.determineIf((permissions) => permissions.canManageStaffRolesAndPermissions || permissions.isSystemAccount)) {
	    throw new Error('Cannot set permission');
	  }
	  this.props.canManageProperties = value;
	}

	set canEditOwnProperty(value: boolean) {
	  if (!this.visa.determineIf((permissions) => permissions.canManageStaffRolesAndPermissions || permissions.isSystemAccount)) {
	    throw new Error('Cannot set permission');
	  }
	  this.props.canEditOwnProperty = value;
	}
}
