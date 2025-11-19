import type { CaseDomainPermissions } from '../../../contexts/case/case.domain-permissions.ts';
import type { ViolationTicketV1EntityReference } from '../../../contexts/case/violation-ticket/v1/violation-ticket-v1.aggregate.ts';
import type { ViolationTicketV1Visa } from '../../../contexts/case/violation-ticket/v1/violation-ticket-v1.visa.ts';
import type { MemberEntityReference } from '../../../contexts/community/member/member.ts';

export class MemberViolationTicketVisa<
	root extends ViolationTicketV1EntityReference,
> implements ViolationTicketV1Visa
{
	private readonly root: root;
	private readonly member: MemberEntityReference;

	constructor(root: root, member: MemberEntityReference) {
		this.root = root;
		this.member = member;
	}

	determineIf(func: (permissions: CaseDomainPermissions) => boolean): boolean {
		//ensure that the member is a member of the community that owns this violation ticket
		if (this.member.community.id !== this.root.communityId) {
			console.log(
				'Member Visa: member is not a member of the community that owns this violation ticket',
				this.member,
				this.root,
			);
			return false;
		}

		const { communityPermissions } = this.member.role.permissions;

		const updatedPermissions: CaseDomainPermissions = {
			...communityPermissions, //using spread here to ensure that we get type safety and we don't need to deep copy
			canCreateTickets: true, // members can create tickets
			canManageTickets: false, // members cannot manage tickets (only staff)
			canAssignTickets: false, // members cannot assign tickets
			canWorkOnTickets: false, // members cannot work on tickets (only staff)
			isEditingOwnTicket: this.root.requestorId === this.member.id,
			isEditingAssignedTicket: this.root.assignedToId === this.member.id,
			isSystemAccount: false,
		};

		return func(updatedPermissions);
	}
}
