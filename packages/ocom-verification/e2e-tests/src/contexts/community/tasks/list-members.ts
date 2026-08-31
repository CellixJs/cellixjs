import { TaskStep } from '@cellix/serenity-framework/serenity';
import { type Actor, Task, the } from '@serenity-js/core';
import { OpenCommunityMemberList } from '../interactions/open-community-member-list.ts';
import { ResolveCommunityAdministratorMembership } from '../interactions/resolve-community-administrator-membership.ts';

export const ListMembers = (communityName: string) =>
	Task.where(
		the`#actor lists members in "${communityName}" via UI`,
		new TaskStep<Actor>('#actor opens the community member list', async (actor) => {
			await actor.attemptsTo(ResolveCommunityAdministratorMembership(actor, communityName), OpenCommunityMemberList(actor, communityName));
		}),
	);
