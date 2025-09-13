import { DomainSeedwork } from '@cellix/domain-seedwork';
import type { CommunityVisa } from '../../community.visa.ts';
import type { PropertyPermissions } from '../../../property/property.permissions.ts';

export interface EndUserRolePropertyPermissionsProps
	extends Omit<
    PropertyPermissions,
    'isEditingOwnProperty' | 'isSystemAccount'>,
		DomainSeedwork.ValueObjectProps {}
export interface EndUserRolePropertyPermissionsEntityReference
	extends Readonly<EndUserRolePropertyPermissionsProps> {}

export class EndUserRolePropertyPermissions
	extends DomainSeedwork.ValueObject<EndUserRolePropertyPermissionsProps>
	implements EndUserRolePropertyPermissionsEntityReference
{
	private readonly visa: CommunityVisa;
	constructor(props: EndUserRolePropertyPermissionsProps, visa: CommunityVisa) {
		super(props);
		this.visa = visa;
	}

	get canManageProperties(): boolean {
		return this.props.canManageProperties;
	}
	set canManageProperties(value: boolean) {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageEndUserRolesAndPermissions ||
					permissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set permission');
		}
		this.props.canManageProperties = value;
	}

	get canEditOwnProperty(): boolean {
		return this.props.canEditOwnProperty;
	}
	set canEditOwnProperty(value: boolean) {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageEndUserRolesAndPermissions ||
					permissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set permission');
		}
		this.props.canEditOwnProperty = value;
	}
}
