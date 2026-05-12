import { notes, Question } from '@serenity-js/core';
import type { CommunityE2ENotes } from '../abilities/community-types.ts';

export const CommunityCreatedFlag = () => Question.about('whether the community was created', (actor) => actor.answer(notes<CommunityE2ENotes>().get('communityCreated')));
