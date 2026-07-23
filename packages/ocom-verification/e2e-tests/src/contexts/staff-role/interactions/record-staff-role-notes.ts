import { type Actor, Interaction, notes, the } from '@serenity-js/core';
import { listPageOn, staffPortalPageOf } from '../abilities/staff-portal-page.ts';
import type { StaffRoleE2ENotes } from '../notes/staff-role-notes.ts';

/**
 * Low-level interaction that reads the currently listed staff role names and
 * records them in actor notes for later assertions. Expects the roles list to
 * be open (see `OpenStaffRolesList`).
 */
export const RecordListedStaffRoleNames = () =>
	Interaction.where(the`#actor records the listed staff role names`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = await staffPortalPageOf(actor);
		await actor.attemptsTo(notes<StaffRoleE2ENotes>().set('listedStaffRoleNames', await listPageOn(page).listedRoleNames()));
	});

/**
 * Low-level interaction that records the current staff role count in actor
 * notes as the baseline for negative-path assertions. Expects the roles list
 * to be open (see `OpenStaffRolesList`).
 */
export const RecordBaselineStaffRoleCount = () =>
	Interaction.where(the`#actor records the baseline staff role count`, async (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		const page = await staffPortalPageOf(actor);
		await actor.attemptsTo(notes<StaffRoleE2ENotes>().set('baselineStaffRoleCount', (await listPageOn(page).listedRoleNames()).length));
	});
