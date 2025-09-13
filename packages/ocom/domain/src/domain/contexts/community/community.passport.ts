import type { CommunityVisa } from './community.visa.ts';
import type { CommunityEntityReference } from './community/community.ts';

export interface CommunityPassport {
	forCommunity(root: CommunityEntityReference): CommunityVisa;
}
