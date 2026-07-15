import { Render } from '@cellix/serenity-framework/dom/render-in-dom';
import { TaskStep } from '@cellix/serenity-framework/serenity';
import { type Actor, notes, Task } from '@serenity-js/core';
import React from 'react';
import { MembersDetail } from '../../../../../../ocom/ui-community-route-admin/src/components/members-detail.tsx';
import { wrapOcomComponent } from '../../../shared/ocom-component-wrapper.ts';
import type { MemberUiNotes } from '../notes/member-notes.ts';

const reactGlobal = globalThis as typeof globalThis & { React?: typeof React };
reactGlobal.React ??= React;

export class UpdateMemberRole extends Task {
	static with(roleName: string, communityName: string): UpdateMemberRole {
		return new UpdateMemberRole(roleName, communityName);
	}

	private constructor(
		private readonly roleName: string,
		private readonly communityName: string,
	) {
		super(`assigns role "${roleName}" in "${communityName}"`);
	}

	async performAs(actor: Actor): Promise<void> {
		const rolesByCommunityName = await actor.answer(notes<MemberUiNotes>().get('rolesByCommunityName'));
		if (!rolesByCommunityName[this.communityName]?.includes(this.roleName)) {
			throw new Error(`Role "${this.roleName}" does not belong to "${this.communityName}"`);
		}

		await actor.attemptsTo(
			notes<MemberUiNotes>().set('lastMemberRoleName', this.roleName),
			notes<MemberUiNotes>().set('memberValidationError', ''),
			Render.component(
				<MembersDetail
					data={{
						member: {
							__typename: 'Member',
							id: await actor.answer(notes<MemberUiNotes>().get('lastMemberId')),
							memberName: 'Charlie Walker',
							role: { __typename: 'EndUserRole', id: `role-${this.roleName}`, roleName: this.roleName },
							createdAt: new Date(),
							updatedAt: new Date(),
						},
					}}
				/>,
				{ wrapper: wrapOcomComponent() },
			),
		);
	}
}

export const SeedEndUserRole = (roleName: string, communityName: string) =>
	Task.where(
		`#actor seeds role "${roleName}" in "${communityName}"`,
		new TaskStep<Actor>('#actor records the available member role', async (actor) => {
			const rolesByCommunityName = await actor.answer(notes<MemberUiNotes>().get('rolesByCommunityName')).catch(() => ({}) as Record<string, string[]>);
			await actor.attemptsTo(
				notes<MemberUiNotes>().set('rolesByCommunityName', {
					...rolesByCommunityName,
					[communityName]: [...(rolesByCommunityName[communityName] ?? []), roleName],
				}),
			);
		}),
	);
