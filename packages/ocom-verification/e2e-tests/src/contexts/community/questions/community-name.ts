import { notes, Question } from '@serenity-js/core';
import type { CommunityE2ENotes } from '../abilities/community-types.ts';

export const CommunityName = () => Question.about('the name of the created community', (actor) => actor.answer(notes<CommunityE2ENotes>().get('communityName')));
