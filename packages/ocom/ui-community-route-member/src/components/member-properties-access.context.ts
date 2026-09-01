import { createContext, useContext } from 'react';

interface MemberPropertiesAccess {
	communityId: string;
	memberId: string;
	/** Rechecks authorization after a stale mutation failure. */
	revalidate: () => Promise<unknown>;
}

const MemberPropertiesAccessContext = createContext<MemberPropertiesAccess | undefined>(undefined);

export const MemberPropertiesAccessProvider = MemberPropertiesAccessContext.Provider;

export const useMemberPropertiesAccess = (): MemberPropertiesAccess => {
	const access = useContext(MemberPropertiesAccessContext);
	if (!access) {
		throw new Error('Member Property route access must be established before rendering Property content.');
	}
	return access;
};
