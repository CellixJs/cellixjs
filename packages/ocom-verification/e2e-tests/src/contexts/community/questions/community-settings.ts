import { notes, Question } from '@serenity-js/core';
import type { CommunityE2ENotes } from '../notes/community-notes.ts';

export const CommunitySettingsSavedFlag = () => Question.about('whether the community settings were saved', (actor) => actor.answer(notes<CommunityE2ENotes>().get('settingsSaved')));

export const DisplayedCommunityName = () => Question.about('the displayed community name', (actor) => actor.answer(notes<CommunityE2ENotes>().get('displayedCommunityName')));

export const SavedWhiteLabelDomain = () => Question.about('the saved white label domain', (actor) => actor.answer(notes<CommunityE2ENotes>().get('savedWhiteLabelDomain')));

export const SavedDomain = () => Question.about('the saved domain', (actor) => actor.answer(notes<CommunityE2ENotes>().get('savedDomain')));

export const SavedHandle = () => Question.about('the saved handle', (actor) => actor.answer(notes<CommunityE2ENotes>().get('savedHandle')));
