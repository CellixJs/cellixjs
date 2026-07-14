import { notes, Question } from '@serenity-js/core';
import type { MemberProfileFormValues, MemberUiNotes } from '../notes/member-notes.ts';

export const UpdatedMemberProfile = () => Question.about('the submitted member profile', (actor) => actor.answer(notes<MemberUiNotes>().get('updatedMemberProfile')) as Promise<MemberProfileFormValues>);

export const MemberUpdatedFlag = () => Question.about('whether the member profile was updated', (actor) => actor.answer(notes<MemberUiNotes>().get('memberUpdated')));
