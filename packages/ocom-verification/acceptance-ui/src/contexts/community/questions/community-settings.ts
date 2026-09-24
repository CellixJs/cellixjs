import { notes, Question } from '@serenity-js/core';
import type { CommunityUiNotes } from '../notes/community-notes.ts';

export const CommunitySettingsSavedFlag = () => Question.about('whether the community settings form was saved', (actor) => actor.answer(notes<CommunityUiNotes>().get('settingsSaved')));

export const SubmittedWhiteLabelDomain = () => Question.about('the submitted white label domain', (actor) => actor.answer(notes<CommunityUiNotes>().get('submittedWhiteLabelDomain')));

export const SubmittedDomain = () => Question.about('the submitted domain', (actor) => actor.answer(notes<CommunityUiNotes>().get('submittedDomain')));

export const SubmittedHandle = () => Question.about('the submitted handle', (actor) => actor.answer(notes<CommunityUiNotes>().get('submittedHandle')));
