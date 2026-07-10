import { notes, Question } from '@serenity-js/core';
import type { MemberE2ENotes } from '../notes/member-notes.ts';

export const MemberCreatedFlag = () => Question.about('whether the member was created', (actor) => actor.answer(notes<MemberE2ENotes>().get('memberCreated')));
