import { notes, Question } from '@serenity-js/core';
import type { CommunityE2ENotes } from '../types.ts';

export const CreatedCommunityName = () => Question.about('the name of the created community', (actor) => actor.answer(notes<CommunityE2ENotes>().get('communityName')));
