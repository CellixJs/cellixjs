import { type Actor, Task } from '@serenity-js/core';
import { BillingHistory } from '../questions/billing-history.ts';

export class ViewBillingHistory extends Task {
	static displayed() {
		return new ViewBillingHistory();
	}

	private constructor() {
		super('views the billing history');
	}

	async performAs(actor: Actor): Promise<void> {
		await actor.answer(BillingHistory.displayed());
	}

	override toString = () => 'views the billing history';
}
