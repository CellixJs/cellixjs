import { notes, Question } from '@serenity-js/core';
import type { CommunityE2ENotes } from './types.ts';

export const CommunityCreatedFlag = () => Question.about('whether the community was created', (actor) => actor.answer(notes<CommunityE2ENotes>().get('communityCreated')));

export const CreatedCommunityName = () => Question.about('the name of the created community', (actor) => actor.answer(notes<CommunityE2ENotes>().get('communityName')));

export const CommunityErrorMessage = () => Question.about('the community error message', (actor) => actor.answer(notes<CommunityE2ENotes>().get('errorMessage')));
