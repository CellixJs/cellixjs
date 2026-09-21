import { type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import type { PaymentInstrumentDisplayResult } from '../../../shared/graphql/community-billing-operations.ts';
import { readCommunityBilling } from './community-billing.ts';

export class PaymentInstrument extends Question<Promise<PaymentInstrumentDisplayResult | undefined>> {
	constructor() {
		super('the payment instrument on file');
	}

	static displayed(): PaymentInstrument {
		return new PaymentInstrument();
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<PaymentInstrumentDisplayResult | undefined> {
		const community = await readCommunityBilling(actor);
		if (community.paymentInstrument) {
			return community.paymentInstrument;
		}
		if (community.finance?.paymentInstrumentId) {
			return { maskedCardNumber: community.finance.paymentInstrumentId };
		}
		return undefined;
	}

	override toString = () => 'the payment instrument on file';
}
