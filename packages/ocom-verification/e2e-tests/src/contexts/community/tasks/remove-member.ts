import { TaskStep } from '@cellix/serenity-framework/serenity';
import { type Actor, Task, the } from '@serenity-js/core';
import { RemoveMember as RemoveMemberInteraction } from '../interactions/remove-member.ts';

export const RemoveMember = (communityName: string, memberName: string) =>
	Task.where(
		the`#actor removes member "${memberName}" from "${communityName}"`,
		new TaskStep<Actor>('#actor removes a member through the community portal', async (actor) => {
			await actor.attemptsTo(RemoveMemberInteraction(actor, communityName, memberName));
		}),
	);
