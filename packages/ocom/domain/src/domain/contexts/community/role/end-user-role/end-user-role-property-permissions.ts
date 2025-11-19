import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import { ValueObject } from '@cellix/domain-seedwork/value-object';
import type { PropertyDomainPermissions } from '../../../property/property.domain-permissions.ts';
import type { CommunityVisa } from '../../community.visa.ts';

export interface EndUserRolePropertyPermissionsProps
	extends Omit<
			PropertyDomainPermissions,
			'isEditingOwnProperty' | 'isSystemAccount'
		>,
		ValueObjectProps {}
export interface EndUserRolePropertyPermissionsEntityReference
	extends Readonly<EndUserRolePropertyPermissionsProps> {}

export class EndUserRolePropertyPermissions
	extends ValueObject<EndUserRolePropertyPermissionsProps>
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
			throw new PermissionError('Cannot set permission');
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
			throw new PermissionError('Cannot set permission');
		}
		this.props.canEditOwnProperty = value;
	}
}
