import { type Actor, Interaction, notes } from '@serenity-js/core';
import type { StaffUiNotes } from '../abilities/staff-types.ts';

export const OpenStaffLanding = () =>
	Interaction.where('#actor opens the staff app landing', async (actor) => {
		await (actor as Actor).attemptsTo(notes<StaffUiNotes>().set('targetRoute', '/staff'));
	});
