import { type Actor, Task } from '@serenity-js/core';
import { detailPageFor, listPageFor, RenderStaffUsersScreen, waitUntilUi } from './staff-user-screen.ts';

export class ViewStaffUserDetails extends Task {
	static forUser(userName: string) {
		return new ViewStaffUserDetails(userName);
	}

	private constructor(private readonly userName: string) {
		super(`views details for staff user "${userName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		await actor.attemptsTo(RenderStaffUsersScreen());
		const listPage = listPageFor(actor);
		await waitUntilUi(async () => (await listPage.listedUserNames()).length > 0, 'Expected the staff users list to render rows');
		await listPage.clickRowForUser(this.userName);
		const detailPage = detailPageFor(actor);
		await waitUntilUi(async () => await detailPage.heading.isVisible(), 'Expected the staff user detail screen to render');
	}

	override toString = () => `views details for staff user "${this.userName}"`;
}
