import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import type { StaffE2ENotes } from '../abilities/staff-types.ts';

export const OpenStaffLanding = (targetRoute: string) =>
	Interaction.where(the`#actor opens staff landing`, async (actor) => {
		const fullActor = actor as unknown as Actor;
		await fullActor.attemptsTo(notes<StaffE2ENotes>().set('currentPath', targetRoute));
	});
