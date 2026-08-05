import { TaskStep } from '@cellix/serenity-framework/serenity';
import { type Actor, Task, the } from '@serenity-js/core';
import { SearchMemberList as SearchMemberListInteraction } from '../interactions/search-member-list.ts';

export const SearchMemberList = (searchTerm: string) =>
	Task.where(
		the`#actor searches the member list for "${searchTerm}"`,
		new TaskStep<Actor>('#actor searches the open member list', async (actor) => {
			await actor.attemptsTo(SearchMemberListInteraction(actor, searchTerm));
		}),
	);
