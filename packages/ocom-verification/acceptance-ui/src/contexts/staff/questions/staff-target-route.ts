import { notes, Question } from '@serenity-js/core';
import type { StaffUiNotes } from '../abilities/staff-types.ts';

export const StaffTargetRoute = () => Question.about('staff landing target route', (actor) => actor.answer(notes<StaffUiNotes>().get('targetRoute')));
