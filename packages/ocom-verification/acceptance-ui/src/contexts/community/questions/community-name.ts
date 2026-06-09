import { notes, Question } from '@serenity-js/core';
import type { CommunityUiNotes } from '../notes/community-notes.ts';

export const CommunityName = () => Question.about('the submitted community name', (actor) => actor.answer(notes<CommunityUiNotes>().get('communityName')));
