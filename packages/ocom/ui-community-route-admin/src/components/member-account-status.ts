interface MemberAccountLike {
	statusCode?: string | null;
	user?: { id?: string | null } | null;
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
