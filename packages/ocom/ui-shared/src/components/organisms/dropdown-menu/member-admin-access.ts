interface MemberAccountLike {
	statusCode?: string | null;
	user?: { id?: string | null } | null;
}

interface AdminPortalMemberLike {
	isAdmin?: boolean | null;
	accounts?: ReadonlyArray<MemberAccountLike | null> | null;
	role?: {
		permissions?: {
			isNonPropertyAdmin?: boolean | null;
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
 * True when a member may enter the admin portal. The backend's `isAdmin` flag
 * treats `canManageProperties` itself as an admin permission, so it cannot be
 * used on its own: members whose role grants admin access through any
 * non-property permission keep the legacy admin entry points (even when they
 * also manage properties), while property-only managers must additionally
 * hold an ACCEPTED account for the current end user — mirroring the backend
 * requirement on the property routes. Keeps navigation entry points in sync
 * with the admin route guard.
 */
export function canAccessAdminPortal(member: AdminPortalMemberLike | null | undefined, currentEndUserId: string | null | undefined): boolean {
	if (!member) {
		return false;
	}
	if (member.role?.permissions?.isNonPropertyAdmin === true) {
		// Admin through permissions unrelated to property management: the
		// account-status restriction below applies only to property managers.
		return true;
	}
	const canManageProperties = member.role?.permissions?.propertyPermissions?.canManageProperties ?? false;
	if (canManageProperties) {
		// Property-only manager: fail closed unless the current end user holds
		// an ACCEPTED account, mirroring the backend property-route requirement.
		return hasAcceptedAccountForUser(member.accounts, currentEndUserId);
	}
	return member.isAdmin === true;
}
