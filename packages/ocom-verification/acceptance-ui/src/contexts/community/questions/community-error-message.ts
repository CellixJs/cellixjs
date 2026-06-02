import { notes, Question } from '@serenity-js/core';
import type { CommunityUiNotes } from '../notes/community-notes.ts';

export const CommunityErrorMessage = () => Question.about('the community form error message', (actor) => actor.answer(notes<CommunityUiNotes>().get('lastValidationError')));
