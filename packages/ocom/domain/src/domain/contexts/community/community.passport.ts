import type { CommunityEntityReference } from './community/community.ts';
import type { CommunityVisa } from './community.visa.ts';

export interface CommunityPassport {
	forCommunity(root: CommunityEntityReference): CommunityVisa;
}
