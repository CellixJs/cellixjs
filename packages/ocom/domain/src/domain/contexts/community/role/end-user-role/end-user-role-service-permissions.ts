import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { ServiceDomainPermissions } from '../../../service/service.domain-permissions.ts';
import type { CommunityVisa } from '../../community.visa.ts';

export interface EndUserRoleServicePermissionsProps
	extends Omit<ServiceDomainPermissions, 'isSystemAccount'>,
		DomainSeedwork.ValueObjectProps {}
export interface EndUserRoleServicePermissionsEntityReference
	extends Readonly<EndUserRoleServicePermissionsProps> {}

export class EndUserRoleServicePermissions
	extends DomainSeedwork.ValueObject<EndUserRoleServicePermissionsProps>
	implements EndUserRoleServicePermissionsEntityReference
{
	//#region Fields
	private readonly visa: CommunityVisa;
	//#endregion Fields

	//#region Constructors
	constructor(props: EndUserRoleServicePermissionsProps, visa: CommunityVisa) {
		super(props);
		this.visa = visa;
	}
	//#endregion Constructors

	//#region Properties
	get canManageServices(): boolean {
		return this.props.canManageServices;
	}
	set canManageServices(value: boolean) {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageEndUserRolesAndPermissions ||
					permissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set permission');
		}
		this.props.canManageServices = value;
	}
	//#endregion Properties
}
