import { DomainSeedwork } from '@cellix/domain-seedwork';
import type { UserVisa } from '../user.visa.ts';

interface StaffRoleServicePermissionsSpec {
	canManageServices: boolean;
	// isSystemAccount: boolean;
}

export interface StaffRoleServicePermissionsProps
	extends StaffRoleServicePermissionsSpec,
		DomainSeedwork.ValueObjectProps {}
export interface StaffRoleServicePermissionsEntityReference
	extends Readonly<StaffRoleServicePermissionsProps> {}

export class StaffRoleServicePermissions
	extends DomainSeedwork.ValueObject<StaffRoleServicePermissionsProps>
	implements StaffRoleServicePermissionsEntityReference
{
	private readonly visa: UserVisa;
	constructor(props: StaffRoleServicePermissionsProps, visa: UserVisa) {
		super(props);
		this.visa = visa;
	}

	get canManageServices(): boolean {
        return this.props.canManageServices;
    }
	// get isSystemAccount(): boolean {return false;}

	// using setters from TS 5.1

	set canManageServices(value:boolean) {
	  if(!this.visa.determineIf((permissions) => permissions.canManageStaffRolesAndPermissions || permissions.isSystemAccount)) {
	    throw new DomainSeedwork.PermissionError('Cannot set permission');
	  }
	  this.props.canManageServices = value;
	}
}
