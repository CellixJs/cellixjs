import { notes, Question } from '@serenity-js/core';
import type { MemberE2ENotes } from '../notes/member-notes.ts';

export const MemberRemovedFlag = () => Question.about('whether the member was removed', (actor) => actor.answer(notes<MemberE2ENotes>().get('memberRemoved')));
