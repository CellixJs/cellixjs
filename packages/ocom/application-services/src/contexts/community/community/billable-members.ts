import { Domain } from '@ocom/domain';

const { Accepted } = Domain.Contexts.Community.Member.MemberAccountStatusCodes;

/**
 * Whether a member occupies a billable seat.
 *
 * Counting every member record over-bills: a deactivated member keeps a REJECTED
 * account, and an invited member who never accepted keeps a CREATED one. Neither
 * is a member of the community in any meaningful sense. A member with no accounts at
 * all is a seat an administrator created directly, so it does count.
 */
export const isBillableMember = (member: Domain.Contexts.Community.Member.MemberEntityReference): boolean => {
	if (member.accounts.length === 0) {
		return true;
	}
	return member.accounts.some((account) => account.statusCode === Accepted);
};

/** Number of members the community should be charged for. */
export const billableMemberCount = (members: ReadonlyArray<Domain.Contexts.Community.Member.MemberEntityReference>): number => members.filter(isBillableMember).length;
