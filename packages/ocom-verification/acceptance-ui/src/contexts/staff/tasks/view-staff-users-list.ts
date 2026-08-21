import { type Actor, Task } from '@serenity-js/core';
import { listPageFor, RenderStaffUsersScreen, waitUntilUi } from './staff-user-screen.ts';

export class ViewStaffUsersList extends Task {
	static forCurrentActor() {
		return new ViewStaffUsersList();
	}

	private constructor() {
		super('views staff users list');
	}

	async performAs(actor: Actor): Promise<void> {
		await actor.attemptsTo(RenderStaffUsersScreen());
		const listPage = listPageFor(actor);
		await waitUntilUi(async () => (await listPage.listedUserNames()).length > 0, 'Expected the staff users list to render rows');
	}

	override toString = () => 'views staff users list';
}
