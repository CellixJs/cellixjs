import { TaskStep } from '@cellix/serenity-framework/serenity';
import { type Actor, notes, Task } from '@serenity-js/core';
import type { StaffUiNotes } from '../../staff/abilities/staff-types.ts';
import { currentMockPath, findMockStaffRoleByName } from '../abilities/mock-staff-role-backend.ts';
import { flushUi, RenderStaffRolesScreen } from './staff-roles-screen.ts';

/**
 * Task that opens the staff roles screen and records the route the router
 * settled on, so authorization redirects can be asserted.
 */
export const OpenStaffRolesScreenRecordingRoute = (): Task =>
	Task.where(
		'#actor opens the staff roles screen',
		new TaskStep<Actor>('#actor renders the staff roles screen and records the route', async (actor) => {
			await actor.attemptsTo(RenderStaffRolesScreen());
			await flushUi();
			await actor.attemptsTo(notes<StaffUiNotes>().set('targetRoute', currentMockPath()));
		}),
	);

/**
 * Task that opens the edit screen for a staff role directly by route and
 * records the route the router settled on.
 */
export const OpenStaffRoleEditScreenRecordingRoute = (roleName: string): Task =>
	Task.where(
		`#actor opens the edit screen for the staff role "${roleName}"`,
		new TaskStep<Actor>('#actor renders the edit screen and records the route', async (actor) => {
			const role = findMockStaffRoleByName(roleName);
			if (!role) {
				throw new Error(`Staff role "${roleName}" is not present in the mocked backend`);
			}
			await actor.attemptsTo(RenderStaffRolesScreen([`/edit/${role.id}`]));
			await flushUi();
			await actor.attemptsTo(notes<StaffUiNotes>().set('targetRoute', currentMockPath()));
		}),
	);
