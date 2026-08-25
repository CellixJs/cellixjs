import { type Actor, Task } from '@serenity-js/core';
import { openUsersList, staffPortalPageOf } from '../abilities/staff-portal-page.ts';

export class ViewStaffUsersList extends Task {
	static forCurrentActor() {
		return new ViewStaffUsersList();
	}

	private constructor() {
		super('views staff users list');
	}

	async performAs(actor: Actor): Promise<void> {
		const page = await staffPortalPageOf(actor as never);
		await openUsersList(page);
	}

	override toString = () => 'views staff users list';
}
