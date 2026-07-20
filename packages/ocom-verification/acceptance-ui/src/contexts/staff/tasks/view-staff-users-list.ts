import { type Actor, notes, Task } from '@serenity-js/core';
import { RenderStaffUsersScreen, listPageFor, waitUntilUi } from './staff-user-screen.ts';
import type { StaffUserManagementUiNotes } from '../notes/staff-user-management-notes.ts';

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
		await actor.attemptsTo(notes<StaffUserManagementUiNotes>().set('result', 'list-visible'));
	}

	override toString = () => 'views staff users list';
}
