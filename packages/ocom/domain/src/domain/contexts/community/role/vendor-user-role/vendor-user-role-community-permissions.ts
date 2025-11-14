import type { ValueObject, ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { CommunityVisa } from '../../community.visa.ts';
import type { CommunityDomainPermissions } from '../../community.domain-permissions.ts';

interface VendorUserRoleCommunityPermissionsSpec
	extends Omit<
			CommunityDomainPermissions,
			| 'canCreateCommunities'
            | 'canManageEndUserRolesAndPermissions'
			| 'isEditingOwnMemberAccount'
			| 'isSystemAccount'
		>,
		ValueObjectProps {}

export interface VendorUserRoleCommunityPermissionsProps
	extends VendorUserRoleCommunityPermissionsSpec,
		ValueObjectProps {}

export class VendorUserRoleCommunityPermissions
	extends ValueObject<VendorUserRoleCommunityPermissionsProps>
	implements VendorUserRoleCommunityPermissionsEntityReference
{
	private readonly visa: CommunityVisa;
	constructor(
		props: VendorUserRoleCommunityPermissionsProps,
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
			throw new PermissionError('Cannot set permission1');
		}
    }

    get canManageVendorUserRolesAndPermissions(): boolean {
        return this.props.canManageVendorUserRolesAndPermissions;
	}
    set canManageVendorUserRolesAndPermissions(value: boolean) {
        this.validateVisa();
		this.props.canManageVendorUserRolesAndPermissions = value;
	}

	get canManageCommunitySettings(): boolean {
		return this.props.canManageCommunitySettings;
	}
    set canManageCommunitySettings(value: boolean) {
        this.validateVisa();
		this.props.canManageCommunitySettings = value;
	}

	get canManageSiteContent(): boolean {
		return this.props.canManageSiteContent;
	}
    set canManageSiteContent(value: boolean) {
        this.validateVisa();
		this.props.canManageSiteContent = value;
	}
	get canManageMembers(): boolean {
		return this.props.canManageMembers;
	}
    set canManageMembers(value: boolean) {
        this.validateVisa();
		this.props.canManageMembers = value;
	}

	get canEditOwnMemberProfile(): boolean {
		return this.props.canEditOwnMemberProfile;
	}
    set canEditOwnMemberProfile(value: boolean) {
        this.validateVisa();
		this.props.canEditOwnMemberProfile = value;
	}

	get canEditOwnMemberAccounts(): boolean {
		return this.props.canEditOwnMemberAccounts;
	}

    set canEditOwnMemberAccounts(value: boolean) {
        this.validateVisa();
		this.props.canEditOwnMemberAccounts = value;
	}
}

export interface VendorUserRoleCommunityPermissionsEntityReference
	extends Readonly<VendorUserRoleCommunityPermissionsProps> {}
