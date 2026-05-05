import { type Actor, type Cast, Notepad, TakeNotes } from '@serenity-js/core';
import type { BrowseTheWeb } from '../abilities/browse-the-web.ts';

export class CellixE2ECast implements Cast {
	constructor(private readonly browseTheWeb?: BrowseTheWeb) {}

	prepare(actor: Actor): Actor {
		if (!this.browseTheWeb) {
			throw new Error('E2E tests require a browser');
		}
		return actor.whoCan(TakeNotes.using(Notepad.empty()), this.browseTheWeb);
	}
}
