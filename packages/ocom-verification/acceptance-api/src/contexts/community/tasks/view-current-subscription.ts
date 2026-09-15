import { type Actor, Task } from '@serenity-js/core';
import { readCommunityBilling, readCommunitySubscription } from '../questions/community-billing.ts';

export class ViewCurrentSubscription extends Task {
	static displayed() {
		return new ViewCurrentSubscription();
	}

	private constructor() {
		super('views the current subscription');
	}

	async performAs(actor: Actor): Promise<void> {
		await readCommunitySubscription(actor);
		await readCommunityBilling(actor);
	}

	override toString = () => 'views the current subscription';
}
