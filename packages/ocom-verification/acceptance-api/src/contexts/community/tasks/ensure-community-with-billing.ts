import { DEFAULT_TEST_PAYMENT_INSTRUMENT } from '@ocom-verification/verification-shared/test-data';
import { type Actor, Task } from '@serenity-js/core';
import type { CommunityDetails } from '../notes/community-notes.ts';
import { CreateCommunity } from './create-community.ts';

export class EnsureCommunityWithBilling extends Task {
	static onPlan(plan: string) {
		return new EnsureCommunityWithBilling({
			name: `${plan} Subscription Community ${Date.now()}`,
			plan,
			...DEFAULT_TEST_PAYMENT_INSTRUMENT,
		});
	}

	static withoutPaymentInstrument() {
		return new EnsureCommunityWithBilling({
			name: `Uninstrumented Community ${Date.now()}`,
		});
	}

	private constructor(private readonly details: CommunityDetails) {
		super(`makes sure a community on the "${details.plan ?? 'default'}" plan exists`);
	}

	async performAs(actor: Actor): Promise<void> {
		await actor.attemptsTo(CreateCommunity.with(this.details));
	}

	override toString = () => `makes sure a community on the "${this.details.plan ?? 'default'}" plan exists`;
}
