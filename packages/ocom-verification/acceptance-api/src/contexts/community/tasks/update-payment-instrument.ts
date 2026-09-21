import { type Actor, notes, Task } from '@serenity-js/core';
import { type PaymentInstrumentInput, UpdatePaymentInstrument as UpdatePaymentInstrumentAbility } from '../../../shared/abilities/update-payment-instrument.ts';
import type { CommunityNotes } from '../notes/community-notes.ts';
import { requireCommunityId } from '../questions/read-community-note.ts';

export class UpdatePaymentInstrument extends Task {
	static with(paymentInstrument: PaymentInstrumentInput) {
		return new UpdatePaymentInstrument(paymentInstrument);
	}

	private constructor(private readonly paymentInstrument: PaymentInstrumentInput) {
		super('updates the community payment instrument');
	}

	async performAs(actor: Actor): Promise<void> {
		const communityId = await requireCommunityId(actor);
		const community = await UpdatePaymentInstrumentAbility.as(actor).performAs(actor, {
			communityId,
			paymentInstrument: this.paymentInstrument,
		});
		await actor.attemptsTo(notes<CommunityNotes>().set('lastCommunityId', community.id), notes<CommunityNotes>().set('lastBillingStatus', 'SUCCESS'));
	}

	override toString = () => 'updates the community payment instrument';
}
