import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import type { CommunityVisa } from '../../community.visa.ts';

interface VendorUserRoleServicePermissionsSpec {
	canManageServices: boolean;
	isSystemAccount: boolean;
}

export interface VendorUserRoleServicePermissionsProps
	extends Omit<VendorUserRoleServicePermissionsSpec, 'isSystemAccount'>,
		ValueObjectProps {}
export interface VendorUserRoleServicePermissionsEntityReference
	extends Readonly<VendorUserRoleServicePermissionsProps> {}

export class VendorUserRoleServicePermissions
	extends ValueObject<VendorUserRoleServicePermissionsProps>
	implements VendorUserRoleServicePermissionsEntityReference
{
	private readonly visa: CommunityVisa;
	constructor(
		props: VendorUserRoleServicePermissionsProps,
		visa: CommunityVisa,
	) {
		super(props);
		this.visa = visa;
	}

	get canManageServices(): boolean {
		return this.props.canManageServices;
	}
	set canManageServices(value: boolean) {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageVendorUserRolesAndPermissions ||
					permissions.isSystemAccount,
			)
		) {
			throw new PermissionError('Cannot set permission');
		}
		this.props.canManageServices = value;
	}
}
