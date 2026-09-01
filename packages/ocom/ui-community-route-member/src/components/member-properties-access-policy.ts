import { hasAcceptedAccountForUser } from '@ocom/ui-shared';

export interface MemberPropertiesRouteMembership {
	id: string;
	accounts?:
		| ReadonlyArray<{
				statusCode?: string | null | undefined;
				user?: { id?: string | null | undefined } | null | undefined;
		  } | null>
		| null
		| undefined;
	role?:
		| {
				permissions?:
					| {
							propertyPermissions?:
								| {
										canManageProperties?: boolean | null | undefined;
										canEditOwnProperty?: boolean | null | undefined;
								  }
								| null
								| undefined;
					  }
					| null
					| undefined;
		  }
		| null
		| undefined;
	community?: { id?: string | null | undefined } | null | undefined;
}

type MemberPropertiesAccessDecision = 'allowed' | 'manager-redirect' | 'denied';

/**
 * Resolves member Property route access from an already authenticated user's
 * memberships. Invalid identities and stale/inactive accounts fail closed.
 */
export const resolveMemberPropertiesAccess = (
	memberships: readonly MemberPropertiesRouteMembership[] | null | undefined,
	currentEndUserId: string | null | undefined,
	communityId: string | undefined,
	memberId: string | undefined,
): MemberPropertiesAccessDecision => {
	if (!communityId || !memberId) {
		return 'denied';
	}
	const currentMember = memberships?.find((member) => String(member.id) === memberId && String(member.community?.id) === communityId);
	if (!currentMember || !hasAcceptedAccountForUser(currentMember.accounts, currentEndUserId)) {
		return 'denied';
	}
	const permissions = currentMember.role?.permissions?.propertyPermissions;
	if (permissions?.canManageProperties) {
		return 'manager-redirect';
	}
	return permissions?.canEditOwnProperty ? 'allowed' : 'denied';
};
