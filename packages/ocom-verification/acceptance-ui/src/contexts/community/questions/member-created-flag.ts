import { notes, Question } from '@serenity-js/core';
import type { MemberUiNotes } from '../notes/member-notes.ts';

export const MemberCreatedFlag = () => Question.about('whether the member form was submitted', (actor) => actor.answer(notes<MemberUiNotes>().get('memberCreated')));
