import { notes, Question } from '@serenity-js/core';
import type { StaffRoleNotes } from '../notes/staff-role-notes.ts';

/** Question that reads the status of the last staff-role mutation from actor notes. */
export const StaffRoleStatus = {
	of: () =>
		Question.about('the staff role mutation status', async (actor) => {
			try {
				return await actor.answer(notes<StaffRoleNotes>().get('lastStaffRoleStatus'));
			} catch {
				return undefined;
			}
		}),
} as const;

/** Question that reads the error captured for the last staff-role action from actor notes. */
export const StaffRoleError = {
	captured: () =>
		Question.about('the captured staff role error', async (actor) => {
			try {
				return await actor.answer(notes<StaffRoleNotes>().get('lastStaffRoleError'));
			} catch {
				return undefined;
			}
		}),
} as const;

/** Question that reads the staff role names recorded when the actor viewed the list. */
export const ListedStaffRoleNames = {
	recorded: () =>
		Question.about('the recorded staff role names', async (actor) => {
			try {
				return await actor.answer(notes<StaffRoleNotes>().get('listedStaffRoleNames'));
			} catch {
				return undefined;
			}
		}),
} as const;

/** Question that reads the staff role count captured before a create attempt. */
export const BaselineStaffRoleCount = {
	recorded: () =>
		Question.about('the baseline staff role count', async (actor) => {
			try {
				return await actor.answer(notes<StaffRoleNotes>().get('baselineStaffRoleCount'));
			} catch {
				return undefined;
			}
		}),
} as const;
