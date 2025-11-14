import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import type { PropertyDomainPermissions } from '../../../property/property.domain-permissions.ts';
import type { CommunityVisa } from '../../community.visa.ts';

export interface VendorUserRolePropertyPermissionsProps
	extends Omit<
			PropertyDomainPermissions,
			'isEditingOwnProperty' | 'isSystemAccount'
		>,
		ValueObjectProps {}
export interface VendorUserRolePropertyPermissionsEntityReference
	extends Readonly<VendorUserRolePropertyPermissionsProps> {}

export class VendorUserRolePropertyPermissions
	extends ValueObject<VendorUserRolePropertyPermissionsProps>
	implements VendorUserRolePropertyPermissionsEntityReference
{
	private readonly visa: CommunityVisa;
	constructor(
		props: VendorUserRolePropertyPermissionsProps,
		visa: CommunityVisa,
	) {
		super(props);
		this.visa = visa;
	}

	private validateVisa(): void {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageVendorUserRolesAndPermissions ||
					permissions.isSystemAccount,
			)
		) {
			throw new PermissionError('Cannot set permission');
		}
	}

	get canManageProperties(): boolean {
		return this.props.canManageProperties;
	}
	set canManageProperties(value: boolean) {
		this.validateVisa();
		this.props.canManageProperties = value;
	}

	get canEditOwnProperty(): boolean {
		return this.props.canEditOwnProperty;
	}
	set canEditOwnProperty(value: boolean) {
		this.validateVisa();
		this.props.canEditOwnProperty = value;
	}
}
