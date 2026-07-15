import { RenderInDom } from '@cellix/serenity-framework/dom/render-in-dom';
import { type Actor, Question } from '@serenity-js/core';

export const DisplayedMemberRole = (roleName: string) =>
	Question.about(`whether the member detail view displays role "${roleName}"`, (serenityActor) => {
		const actor = serenityActor as unknown as Actor;
		return (RenderInDom.as(actor).container.textContent ?? '').includes(roleName);
	});
