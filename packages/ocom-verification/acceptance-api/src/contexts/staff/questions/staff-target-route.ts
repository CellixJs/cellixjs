import { notes, Question } from '@serenity-js/core';
import type { StaffApiNotes } from '../notes/staff-notes.ts';

export const StaffTargetRoute = () => Question.about('the target staff route', (actor) => actor.answer(notes<StaffApiNotes>().get('targetRoute')));
