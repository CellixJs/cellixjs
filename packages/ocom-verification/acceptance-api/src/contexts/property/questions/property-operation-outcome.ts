import { notes, Question } from '@serenity-js/core';
import type { PropertyNotes } from '../notes/property-notes.ts';

/** Question that reads the status of the last property operation from actor notes. */
export const PropertyOperationStatus = {
	of: () =>
		Question.about('the property operation status', async (actor) => {
			try {
				return await actor.answer(notes<PropertyNotes>().get('lastPropertyStatus'));
			} catch {
				return undefined;
			}
		}),
} as const;

/** Question that reads the error captured for the last property action from actor notes. */
export const PropertyOperationError = {
	captured: () =>
		Question.about('the captured property error', async (actor) => {
			try {
				return await actor.answer(notes<PropertyNotes>().get('lastPropertyError'));
			} catch {
				return undefined;
			}
		}),
} as const;

/** Question that reads the id of the property created or acted on last. */
export const LastPropertyId = {
	recorded: () =>
		Question.about('the last property id', async (actor) => {
			try {
				return await actor.answer(notes<PropertyNotes>().get('lastPropertyId'));
			} catch {
				return undefined;
			}
		}),
} as const;
