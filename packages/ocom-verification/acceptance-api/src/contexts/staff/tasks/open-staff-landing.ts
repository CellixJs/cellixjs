import { type Actor, Interaction, notes } from '@serenity-js/core';
import type { StaffApiNotes } from '../notes/staff-notes.ts';

export const OpenStaffLanding = (targetRoute: string) =>
	Interaction.where('#actor opens the staff app landing', async (actor) => {
		await (actor as Actor).attemptsTo(notes<StaffApiNotes>().set('targetRoute', targetRoute));
	});
