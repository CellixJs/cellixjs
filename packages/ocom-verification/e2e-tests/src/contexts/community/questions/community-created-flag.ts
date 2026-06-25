import { notes, Question } from '@serenity-js/core';
import type { CommunityE2ENotes } from '../notes/community-notes.ts';

export const CommunityCreatedFlag = () => Question.about('whether the community was created', (actor) => actor.answer(notes<CommunityE2ENotes>().get('communityCreated')));
