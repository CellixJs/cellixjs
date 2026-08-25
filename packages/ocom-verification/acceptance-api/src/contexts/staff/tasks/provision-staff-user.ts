import { actorCalled, type Actor, notes, Task } from '@serenity-js/core';
import { setActorToken, staffTokenFor } from '../../../shared/abilities/actor-auth.ts';
import { currentStaffUserAbility, findStaffRoleByName, findStaffUserByDisplayName, listStaffUsers, loadStaffUserById } from '../../../shared/abilities/staff-user.ts';
import type { StaffUserManagementApiNotes } from '../notes/staff-user-management-notes.ts';

export class ProvisionStaffUser extends Task {
	static withDefaults(userName: string, role: string) {
		return new ProvisionStaffUser(userName, role);
	}

	private constructor(
		private readonly userName: string,
		private readonly role: string,
	) {
		super(`provisions staff user "${userName}" with role "${role}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const existingUser = await findStaffUserByDisplayName(actor, this.userName);
		if (existingUser) {
			await actor.attemptsTo(
				notes<StaffUserManagementApiNotes>().set('staffUserName', existingUser.displayName),
				notes<StaffUserManagementApiNotes>().set('role', existingUser.role?.roleName ?? ''),
			);
			return;
		}

		const targetRole = await findStaffRoleByName(actor, this.role);
		if (!targetRole) {
			throw new Error(`Staff role "${this.role}" was not found`);
		}

		setActorToken(this.userName, staffTokenFor(this.userName));
		const provisioningActor = actorCalled(this.userName);
		try {
			const createdUser = await currentStaffUserAbility().performAs(provisioningActor);
			await actor.attemptsTo(
				notes<StaffUserManagementApiNotes>().set('staffUserName', createdUser.displayName || this.userName),
				notes<StaffUserManagementApiNotes>().set('role', createdUser.role?.roleName ?? targetRole.roleName),
				notes<StaffUserManagementApiNotes>().set('result', 'provisioned'),
			);
		} finally {
			setActorToken(this.userName, null);
		}

		if ((await listStaffUsers(actor)).length === 0) {
			throw new Error('No staff users were returned from the backend');
		}
		const createdUser = await findStaffUserByDisplayName(actor, this.userName);
		if (!createdUser) {
			throw new Error(`Expected staff user "${this.userName}" to be created in the database`);
		}
		const details = await loadStaffUserById(actor, createdUser.id);
		if ((details.role?.roleName ?? '').toLowerCase() !== targetRole.roleName.toLowerCase()) {
			const userRole = await findStaffUserByDisplayName(actor, this.userName);
			if (!userRole) {
				throw new Error(`Expected staff user "${this.userName}" to exist after provisioning`);
			}
		}
	}

	override toString = () => `provisions staff user "${this.userName}" with role "${this.role}"`;
}
