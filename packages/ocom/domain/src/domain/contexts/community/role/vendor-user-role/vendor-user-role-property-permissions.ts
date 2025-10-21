import { DomainSeedwork } from '@cellix/domain-seedwork';
import type { CommunityVisa } from '../../community.visa.ts';
import type { PropertyDomainPermissions } from '../../../property/property.domain-permissions.ts';

export interface VendorUserRolePropertyPermissionsProps
	extends Omit<
	        PropertyDomainPermissions,
            'isEditingOwnProperty' | 'isSystemAccount'>,
		DomainSeedwork.ValueObjectProps {}
export interface VendorUserRolePropertyPermissionsEntityReference
	extends Readonly<VendorUserRolePropertyPermissionsProps> {}

export class VendorUserRolePropertyPermissions
	extends DomainSeedwork.ValueObject<VendorUserRolePropertyPermissionsProps>
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
            throw new DomainSeedwork.PermissionError('Cannot set permission');
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
