import { TaskStep } from '@cellix/serenity-framework/serenity';
import { type Actor, Task, the } from '@serenity-js/core';
import { OpenMemberAccountAssignment } from '../interactions/open-member-account-assignment.ts';
import { ResolveCommunityAdministratorMembership } from '../interactions/resolve-community-administrator-membership.ts';
import { SelectMemberEndUserAccount } from '../interactions/select-member-end-user-account.ts';
import { SubmitMemberAccountAssignment } from '../interactions/submit-member-account-assignment.ts';

export const AssignMemberAccount = (communityName: string, displayName: string) =>
	Task.where(
		the`#actor assigns end-user account "${displayName}" in "${communityName}"`,
		new TaskStep<Actor>('#actor assigns an end-user account through the community portal', async (actor) => {
			await actor.attemptsTo(ResolveCommunityAdministratorMembership(actor, communityName), OpenMemberAccountAssignment(actor, communityName), SelectMemberEndUserAccount(actor, displayName), SubmitMemberAccountAssignment(actor));
		}),
	);
