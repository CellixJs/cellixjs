import { TaskStep } from '@cellix/serenity-framework/serenity';
import { type Actor, Task, the } from '@serenity-js/core';
import { SubmitMemberCreateForm } from '../interactions/fill-and-submit-member-create-form.ts';
import { FillMemberCreateForm } from '../interactions/fill-member-create-form.ts';
import { OpenCreateMemberForm } from '../interactions/open-create-member-form.ts';
import { ResolveCommunityAdministratorMembership } from '../interactions/resolve-community-administrator-membership.ts';

export const CreateMember = (communityName: string, memberName: string) =>
	Task.where(
		the`#actor creates member "${memberName}" in "${communityName}" via UI`,
		new TaskStep<Actor>('#actor creates a member through the community portal', async (actor) => {
			await actor.attemptsTo(ResolveCommunityAdministratorMembership(actor, communityName), OpenCreateMemberForm(actor, communityName), FillMemberCreateForm(actor, memberName), SubmitMemberCreateForm(actor, memberName));
		}),
	);
