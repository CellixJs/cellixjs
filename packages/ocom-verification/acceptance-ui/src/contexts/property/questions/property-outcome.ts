import { notes, Question } from '@serenity-js/core';
import { lastPropertyMutation, lastViewedPropertyCommunity, type MockMutationResult, mockPropertyCount } from '../abilities/mock-property-backend.ts';
import type { PropertyUiNotes } from '../notes/property-ui-notes.ts';

/** Question that reads the outcome of the last mocked property mutation. */
export const LastPropertyMutation = (): Question<Promise<MockMutationResult | undefined>> => Question.about('the last property mutation outcome', async () => lastPropertyMutation());

/** Question that reads the current property count from the mocked backend. */
export const MockedPropertyCount = (): Question<Promise<number>> => Question.about('the mocked property count', async () => mockPropertyCount());

/** Question that reads the property count captured before a create attempt. */
export const BaselinePropertyCount = () =>
	Question.about('the baseline property count', async (actor) => {
		try {
			return await actor.answer(notes<PropertyUiNotes>().get('baselinePropertyCount'));
		} catch {
			return undefined;
		}
	});

/** Question that reads the community of the property last loaded in the detail screen. */
export const ViewedPropertyCommunity = (): Question<Promise<string | undefined>> => Question.about('the viewed property community', async () => lastViewedPropertyCommunity());
