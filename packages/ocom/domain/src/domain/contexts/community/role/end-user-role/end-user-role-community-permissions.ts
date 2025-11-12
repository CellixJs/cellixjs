import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { CommunityVisa } from '../../community.visa.ts';
import type { CommunityDomainPermissions } from '../../community.domain-permissions.ts';

export interface EndUserRoleCommunityPermissionsProps
	extends Omit<
			CommunityDomainPermissions,
			'canCreateCommunities' | 'canManageVendorUserRolesAndPermissions' | 'isEditingOwnMemberAccount' | 'isSystemAccount'
		>,
		DomainSeedwork.ValueObjectProps {}
export interface EndUserRoleCommunityPermissionsEntityReference
	extends Readonly<EndUserRoleCommunityPermissionsProps> {}

export class EndUserRoleCommunityPermissions
	extends DomainSeedwork.ValueObject<EndUserRoleCommunityPermissionsProps>
	implements EndUserRoleCommunityPermissionsEntityReference
{
	private visa: CommunityVisa;

	constructor(
		props: EndUserRoleCommunityPermissionsProps,
		visa: CommunityVisa,
	) {
		super(props);
		this.visa = visa;
	}

	get canManageEndUserRolesAndPermissions(): boolean {
		return this.props.canManageEndUserRolesAndPermissions;
	}
	set canManageEndUserRolesAndPermissions(value: boolean) {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageEndUserRolesAndPermissions ||
					permissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set permission1');
		}
		this.props.canManageEndUserRolesAndPermissions = value;
	}

	get canManageCommunitySettings(): boolean {
		return this.props.canManageCommunitySettings;
	}
	set canManageCommunitySettings(value: boolean) {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageEndUserRolesAndPermissions ||
					permissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set permission2');
		}
		this.props.canManageCommunitySettings = value;
	}

	get canManageSiteContent(): boolean {
		return this.props.canManageSiteContent;
	}
	set canManageSiteContent(value: boolean) {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageEndUserRolesAndPermissions ||
					permissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set permission3');
		}
		this.props.canManageSiteContent = value;
	}

	get canManageMembers(): boolean {
		return this.props.canManageMembers;
	}
	set canManageMembers(value: boolean) {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageEndUserRolesAndPermissions ||
					permissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set permission');
		}
		this.props.canManageMembers = value;
	}

	get canEditOwnMemberProfile(): boolean {
		return this.props.canEditOwnMemberProfile;
	}
	set canEditOwnMemberProfile(value: boolean) {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageEndUserRolesAndPermissions ||
					permissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set permission');
		}
		this.props.canEditOwnMemberProfile = value;
	}

	get canEditOwnMemberAccounts(): boolean {
		return this.props.canEditOwnMemberAccounts;
	}
	set canEditOwnMemberAccounts(value: boolean) {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageEndUserRolesAndPermissions ||
					permissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set permission');
		}
		this.props.canEditOwnMemberAccounts = value;
	}
}
