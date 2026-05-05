import { notes, Question } from '@serenity-js/core';
import type { CommunityE2ENotes } from '../abilities/community-types.ts';

export const CommunityErrorMessage = () => Question.about('the community error message', (actor) => actor.answer(notes<CommunityE2ENotes>().get('errorMessage')));
