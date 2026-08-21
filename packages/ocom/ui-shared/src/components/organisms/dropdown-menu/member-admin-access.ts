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
 * True when a member may enter the admin portal. Members whose role grants
 * property management must also hold an ACCEPTED account for the current end
 * user — the backend's `isAdmin` flag treats `canManageProperties` itself as
 * an admin permission, so it cannot be used to bypass the active-account
 * requirement for property managers. Members that are admins through other
 * permissions keep the legacy admin entry points. Keeps navigation entry
 * points in sync with the admin route guard.
 */
export function canAccessAdminPortal(member: AdminPortalMemberLike | null | undefined, currentEndUserId: string | null | undefined): boolean {
	if (!member) {
		return false;
	}
	const canManageProperties = member.role?.permissions?.propertyPermissions?.canManageProperties ?? false;
	if (canManageProperties) {
		// Fail closed: with only the property permission queried, a member
		// holding it cannot be distinguished from a plain property manager,
		// so an ACCEPTED account is required before offering the portal.
		return hasAcceptedAccountForUser(member.accounts, currentEndUserId);
	}
	return member.isAdmin === true;
}
