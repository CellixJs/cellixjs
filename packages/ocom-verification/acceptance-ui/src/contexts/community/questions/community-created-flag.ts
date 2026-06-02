import { notes, Question } from '@serenity-js/core';
import type { CommunityUiNotes } from '../notes/community-notes.ts';

export const CommunityCreatedFlag = () => Question.about('whether the community form was submitted', (actor) => actor.answer(notes<CommunityUiNotes>().get('formSubmitted')));
