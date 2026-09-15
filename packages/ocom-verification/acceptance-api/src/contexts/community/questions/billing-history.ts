import { type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import type { CommunityTransactionResult } from '../../../shared/graphql/community-billing-operations.ts';
import { readCommunityBilling } from './community-billing.ts';

export class BillingHistory extends Question<Promise<CommunityTransactionResult[]>> {
	constructor() {
		super('the billing history');
	}

	static displayed(): BillingHistory {
		return new BillingHistory();
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<CommunityTransactionResult[]> {
		const community = await readCommunityBilling(actor);
		return community.finance?.transactions ?? [];
	}

	override toString = () => 'the billing history';
}
