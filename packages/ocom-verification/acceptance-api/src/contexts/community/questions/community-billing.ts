import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import type { Actor, AnswersQuestions, UsesAbilities } from '@serenity-js/core';
import { type CommunityBillingResult, type CommunitySubscriptionResult, GET_COMMUNITY_BILLING_QUERY, GET_COMMUNITY_SUBSCRIPTION_QUERY } from '../../../shared/graphql/community-billing-operations.ts';
import { MEMBERS_BY_COMMUNITY_QUERY, type MemberResult } from '../../../shared/graphql/member-operations.ts';
import { requireCommunityId } from './read-community-note.ts';

export async function readCommunityBilling(actor: AnswersQuestions & UsesAbilities, communityId?: string): Promise<CommunityBillingResult> {
	const id = communityId ?? (await requireCommunityId(actor));
	const response = await GraphQLClient.as(actor as unknown as Actor).execute(GET_COMMUNITY_BILLING_QUERY, { id });
	const community = response.data['communityById'] as CommunityBillingResult | undefined;
	if (!community) {
		throw new Error(`Community ${id} was not found when reading billing details`);
	}
	return community;
}

export async function readCommunitySubscription(actor: AnswersQuestions & UsesAbilities, communityId?: string): Promise<CommunitySubscriptionResult | undefined> {
	const id = communityId ?? (await requireCommunityId(actor));
	try {
		const response = await GraphQLClient.as(actor as unknown as Actor).execute(GET_COMMUNITY_SUBSCRIPTION_QUERY, { communityId: id });
		return response.data['communitySubscription'] as CommunitySubscriptionResult | undefined;
	} catch {
		return undefined;
	}
}

/** Like {@link readCommunitySubscription} but surfaces authorization failures instead of hiding them. */
export async function readCommunitySubscriptionStrict(actor: AnswersQuestions & UsesAbilities, communityId?: string): Promise<CommunitySubscriptionResult | undefined> {
	const id = communityId ?? (await requireCommunityId(actor));
	const response = await GraphQLClient.as(actor as unknown as Actor).execute(GET_COMMUNITY_SUBSCRIPTION_QUERY, { communityId: id });
	return response.data['communitySubscription'] as CommunitySubscriptionResult | undefined;
}

export async function readCommunityMembers(actor: AnswersQuestions & UsesAbilities, communityId?: string): Promise<MemberResult[]> {
	const id = communityId ?? (await requireCommunityId(actor));
	const response = await GraphQLClient.as(actor as unknown as Actor).execute(MEMBERS_BY_COMMUNITY_QUERY, { communityId: id });
	return (response.data['membersByCommunityId'] as MemberResult[] | undefined) ?? [];
}
