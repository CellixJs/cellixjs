import { type Actor, notes, Task } from '@serenity-js/core';
import type { StaffUserManagementApiNotes } from '../notes/staff-user-management-notes.ts';

export class RecordAccessResult extends Task {
	static withResult(result: string) {
		return new RecordAccessResult(result);
	}

	private constructor(private readonly result: string) {
		super(`records access result "${result}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		await actor.attemptsTo(notes<StaffUserManagementApiNotes>().set('result', this.result));
	}

	override toString = () => `records access result "${this.result}"`;
}
