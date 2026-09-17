import type { CommunityBillingResult, CommunityMutationPayload } from '../graphql/community-billing-operations.ts';

export function requireSuccessfulCommunityMutation(payload: CommunityMutationPayload | undefined, operationName: string): CommunityBillingResult {
	if (payload?.status?.success !== true) {
		throw new Error(String(payload?.status?.errorMessage ?? `Failed to ${operationName}`));
	}
	const community = payload.community;
	if (!community?.id) {
		throw new Error(`${operationName} reported success but returned no community id`);
	}
	return community;
}
