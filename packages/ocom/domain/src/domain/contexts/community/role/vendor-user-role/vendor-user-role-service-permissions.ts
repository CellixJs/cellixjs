import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { CommunityVisa } from '../../community.visa.ts';

interface VendorUserRoleServicePermissionsSpec {
	canManageServices: boolean;
	isSystemAccount: boolean;
}

export interface VendorUserRoleServicePermissionsProps
	extends Omit<VendorUserRoleServicePermissionsSpec, 'isSystemAccount'>,
		DomainSeedwork.ValueObjectProps {}
export interface VendorUserRoleServicePermissionsEntityReference
	extends Readonly<VendorUserRoleServicePermissionsProps> {}

export class VendorUserRoleServicePermissions
	extends DomainSeedwork.ValueObject<VendorUserRoleServicePermissionsProps>
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
			throw new DomainSeedwork.PermissionError('Cannot set permission');
		}
		this.props.canManageServices = value;
	}
}
