import { TaskStep } from '@cellix/serenity-framework/serenity';
import { type Actor, Task, the } from '@serenity-js/core';
import { SubmitMemberProfileForm } from '../interactions/fill-and-submit-member-profile-form.ts';
import { FillMemberProfileForm } from '../interactions/fill-member-profile-form.ts';
import { OpenMemberProfileEditor } from '../interactions/open-member-profile-editor.ts';
import { ResolveCommunityAdministratorMembership } from '../interactions/resolve-community-administrator-membership.ts';
import type { MemberProfileExpectation } from '../notes/member-notes.ts';

interface UpdateMemberProfileDetails {
	communityName: string;
	memberName: string;
	profile: MemberProfileExpectation;
}

export const UpdateMemberProfile = (details: UpdateMemberProfileDetails) =>
	Task.where(
		the`#actor updates member profile for "${details.memberName}" in "${details.communityName}"`,
		new TaskStep<Actor>('#actor updates the member profile through the community portal', async (actor) => {
			await actor.attemptsTo(
				ResolveCommunityAdministratorMembership(actor, details.communityName),
				OpenMemberProfileEditor(actor, details.communityName, details.memberName),
				FillMemberProfileForm(actor, details.profile),
				SubmitMemberProfileForm(actor),
			);
		}),
	);
