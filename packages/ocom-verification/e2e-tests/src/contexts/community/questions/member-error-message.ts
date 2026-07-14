import { notes, Question } from '@serenity-js/core';
import type { MemberE2ENotes } from '../notes/member-notes.ts';

export const MemberErrorMessage = () => Question.about('the member validation error', (actor) => actor.answer(notes<MemberE2ENotes>().get('errorMessage')));
