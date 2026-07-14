import { Render } from '@cellix/serenity-framework/dom/render-in-dom';
import { Then, When } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight, notes } from '@serenity-js/core';
import { MemberList } from '../../../../../../ocom/ui-community-route-admin/src/components/members-list.tsx';
import type { AdminMemberListContainerMemberFieldsFragment } from '../../../../../../ocom/ui-community-route-admin/src/generated.tsx';
import { wrapOcomComponent } from '../../../shared/ocom-component-wrapper.ts';
import type { MemberUiNotes } from '../notes/member-notes.ts';
import { MemberListedInCommunity } from '../questions/member-listed-in-community.ts';
import { MemberRemovedFlag } from '../questions/member-removed-flag.ts';
import { RemoveMember } from '../tasks/remove-member.ts';

When('{word} removes member {string} from {string}', async (actorName: string, memberName: string, _communityName: string) => {
	const actor = actorCalled(actorName);
	const memberId = await actor.answer(notes<MemberUiNotes>().get('lastMemberId'));
	const member: AdminMemberListContainerMemberFieldsFragment = {
		id: memberId,
		memberName,
		isAdmin: false,
		accounts: [],
		profile: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const onRemoveMember = async (removedMemberId: string): Promise<boolean> => {
		await actor.attemptsTo(notes<MemberUiNotes>().set('memberRemoved', removedMemberId === memberId));
		return removedMemberId === memberId;
	};

	await actor.attemptsTo(
		notes<MemberUiNotes>().set('memberRemoved', false),
		Render.component(
			<MemberList
				data={[member]}
				onRemoveMember={onRemoveMember}
			/>,
			{ wrapper: wrapOcomComponent() },
		),
		RemoveMember(memberName),
	);

	if (await actor.answer(MemberRemovedFlag())) {
		await actor.attemptsTo(
			Render.component(
				<MemberList
					data={[]}
					onRemoveMember={onRemoveMember}
				/>,
				{ wrapper: wrapOcomComponent() },
			),
		);
	}
});

Then('the member should be removed successfully from {string}', async (_communityName: string) => {
	if (!(await actorInTheSpotlight().answer(MemberRemovedFlag()))) {
		throw new Error('Expected member removal callback to succeed');
	}
});

Then('member {string} should not appear in member listings for {string}', async (memberName: string, _communityName: string) => {
	if (await actorInTheSpotlight().answer(MemberListedInCommunity(memberName))) {
		throw new Error(`Expected member "${memberName}" not to appear in the rendered member list`);
	}
});
