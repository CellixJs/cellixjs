import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { CommunityVisa } from '../../community.visa.ts';
import type { CaseDomainPermissions } from '../../../case/case.domain-permissions.ts';

export interface VendorUserRoleViolationTicketPermissionsProps
	extends Omit<
            CaseDomainPermissions,
            'isEditingOwnTicket' | 'isEditingAssignedTicket' | 'isSystemAccount'>,
		DomainSeedwork.ValueObjectProps {}
export interface VendorUserRoleViolationTicketPermissionsEntityReference
	extends Readonly<VendorUserRoleViolationTicketPermissionsProps> {}

export class VendorUserRoleViolationTicketPermissions
	extends DomainSeedwork.ValueObject<VendorUserRoleViolationTicketPermissionsProps>
	implements VendorUserRoleViolationTicketPermissionsEntityReference
{
	private readonly visa: CommunityVisa;
	constructor(
		props: VendorUserRoleViolationTicketPermissionsProps,
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

	get canCreateTickets(): boolean {
		return this.props.canCreateTickets;
	}
    set canCreateTickets(value: boolean) {
        this.validateVisa();
		this.props.canCreateTickets = value;
	}

	get canManageTickets(): boolean {
		return this.props.canManageTickets;
	}
    set canManageTickets(value: boolean) {
        this.validateVisa();
		this.props.canManageTickets = value;
	}

	get canAssignTickets(): boolean {
		return this.props.canAssignTickets;
	}
    set canAssignTickets(value: boolean) {
        this.validateVisa();
		this.props.canAssignTickets = value;
	}

	get canWorkOnTickets(): boolean {
		return this.props.canWorkOnTickets;
	}
    set canWorkOnTickets(value: boolean) {
        this.validateVisa();
		this.props.canWorkOnTickets = value;
	}
}
