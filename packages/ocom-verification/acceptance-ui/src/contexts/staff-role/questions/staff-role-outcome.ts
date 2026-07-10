import { notes, Question } from '@serenity-js/core';
import { lastStaffRoleMutation, type MockMutationResult, mockStaffRoleCount } from '../abilities/mock-staff-role-backend.ts';
import type { StaffRoleUiNotes } from '../notes/staff-role-notes.ts';

/** Question that reads the outcome of the last mocked staff-role mutation. */
export const LastStaffRoleMutation = (): Question<Promise<MockMutationResult | undefined>> => Question.about('the last staff role mutation outcome', async () => lastStaffRoleMutation());

/** Question that reads the current staff role count from the mocked backend. */
export const MockedStaffRoleCount = (): Question<Promise<number>> => Question.about('the mocked staff role count', async () => mockStaffRoleCount());

/** Question that reads the staff role count captured before a create attempt. */
export const BaselineStaffRoleCount = () =>
	Question.about('the baseline staff role count', async (actor) => {
		try {
			return await actor.answer(notes<StaffRoleUiNotes>().get('baselineStaffRoleCount'));
		} catch {
			return undefined;
		}
	});
