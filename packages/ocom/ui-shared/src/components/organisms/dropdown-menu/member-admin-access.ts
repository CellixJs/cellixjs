interface MemberAccountLike {
	statusCode?: string | null;
	user?: { id?: string | null } | null;
}

interface AdminPortalMemberLike {
	isAdmin?: boolean | null;
	accounts?: ReadonlyArray<MemberAccountLike | null> | null;
	role?: {
		permissions?: {
			propertyPermissions?: {
				canManageProperties?: boolean | null;
			} | null;
		} | null;
	} | null;
}

/**
 * True when the given member accounts contain an ACCEPTED account belonging
 * to the current end user. Mirrors the backend requirement that property
 * management is only available to members with an active (ACCEPTED) account.
 */
export function hasAcceptedAccountForUser(accounts: ReadonlyArray<MemberAccountLike | null> | null | undefined, currentEndUserId: string | null | undefined): boolean {
	if (!currentEndUserId) {
		return false;
	}
	return (accounts ?? []).some((account) => account?.statusCode === 'ACCEPTED' && account?.user?.id === currentEndUserId);
}

/**
 * True when a member may enter the admin portal: either an admin, or a
 * member whose role grants property management and who holds an ACCEPTED
 * account for the current end user. Keeps navigation entry points in sync
 * with the admin route guard.
 */
export function canAccessAdminPortal(member: AdminPortalMemberLike | null | undefined, currentEndUserId: string | null | undefined): boolean {
	if (!member) {
		return false;
	}
	if (member.isAdmin) {
		return true;
	}
	const canManageProperties = member.role?.permissions?.propertyPermissions?.canManageProperties ?? false;
	return canManageProperties && hasAcceptedAccountForUser(member.accounts, currentEndUserId);
}
