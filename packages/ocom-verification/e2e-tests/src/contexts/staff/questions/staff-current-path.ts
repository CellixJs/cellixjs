import { notes, Question } from '@serenity-js/core';
import type { StaffE2ENotes } from '../abilities/staff-types.ts';

export const StaffCurrentPath = () => Question.about('current staff app path', (actor) => actor.answer(notes<StaffE2ENotes>().get('currentPath')));
