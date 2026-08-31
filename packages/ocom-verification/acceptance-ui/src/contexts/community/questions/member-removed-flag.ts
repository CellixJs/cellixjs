import { notes, Question } from '@serenity-js/core';
import type { MemberUiNotes } from '../notes/member-notes.ts';

export const MemberRemovedFlag = () => Question.about('whether the member was removed', (actor) => actor.answer(notes<MemberUiNotes>().get('memberRemoved')));
